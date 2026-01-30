import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { appConfigSchema } from "./schema";
import { defaultConfig } from "./defaults";
import type { AppConfig } from "../types/config";
import { logger } from "../utils/logger";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepMerge(base: Record<string, unknown>, override: Record<string, unknown>): Record<string, unknown> {
  const output: Record<string, unknown> = { ...base };

  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) {
      continue;
    }

    if (isRecord(value) && isRecord(output[key])) {
      output[key] = deepMerge(output[key] as Record<string, unknown>, value);
      continue;
    }

    output[key] = value;
  }

  return output;
}

export function loadConfig(): AppConfig {
  dotenv.config();

  const configPath = path.join(process.cwd(), "config", "agent.json");
  let fileConfig: Record<string, unknown> = {};

  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, "utf8");
    try {
      fileConfig = JSON.parse(raw) as Record<string, unknown>;
    } catch (error) {
      logger.warn("Failed to parse config/agent.json. Using defaults.", error);
    }
  }

  const envConfig: Record<string, unknown> = {};

  if (process.env.PORT) {
    envConfig.gateway = { port: Number(process.env.PORT) };
  }

  const providerConfig: Record<string, unknown> = {};
  if (process.env.OPENAI_API_KEY) {
    providerConfig.type = "openai";
    providerConfig.apiKey = process.env.OPENAI_API_KEY;
    if (process.env.OPENAI_MODEL) {
      providerConfig.model = process.env.OPENAI_MODEL;
    }
  }
  if (process.env.ANTHROPIC_API_KEY) {
    providerConfig.type = "anthropic";
    providerConfig.apiKey = process.env.ANTHROPIC_API_KEY;
    if (process.env.ANTHROPIC_MODEL) {
      providerConfig.model = process.env.ANTHROPIC_MODEL;
    }
  }
  if (Object.keys(providerConfig).length > 0) {
    envConfig.provider = providerConfig;
  }

  if (process.env.TELEGRAM_BOT_TOKEN) {
    envConfig.channels = {
      ...(envConfig.channels as Record<string, unknown> | undefined),
      telegram: {
        enabled: true,
        token: process.env.TELEGRAM_BOT_TOKEN
      }
    };
  }

  const merged = deepMerge(defaultConfig as unknown as Record<string, unknown>, fileConfig);
  const mergedWithEnv = deepMerge(merged, envConfig);

  return appConfigSchema.parse(mergedWithEnv) as AppConfig;
}
