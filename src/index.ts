import path from "path";
import fs from "fs";
import { createGateway } from "./gateway/server";
import { registerWebChat } from "./channels/webchat/server";
import { createTelegramBot } from "./channels/telegram/bot";
import { createDiscordClient } from "./channels/discord/bot";
import { loadConfig } from "./config/loader";
import { logger } from "./utils/logger";
import { createProvider } from "./agent/providers";
import { createDefaultToolRegistry } from "./agent/tools";
import { AgentRuntime } from "./agent/runtime";
import { AgentService } from "./agent/service";
import { SessionStore } from "./sessions/store";
import { SessionManager } from "./sessions/manager";
import { Allowlist } from "./security/allowlist";
import { assertNonEmpty } from "./utils/validators";

function loadOptionalFile(filePath: string): string | undefined {
  if (!fs.existsSync(filePath)) {
    return undefined;
  }
  const raw = fs.readFileSync(filePath, "utf8").trim();
  return raw.length > 0 ? raw : undefined;
}

async function main(): Promise<void> {
  const config = loadConfig();
  const provider = await createProvider(config.provider);
  const tools = createDefaultToolRegistry();

  const systemPrompt = loadOptionalFile(path.join(process.cwd(), "workspace", "AGENTS.md"));
  const runtime = new AgentRuntime({
    provider,
    tools,
    systemPrompt,
    maxToolSteps: 4
  });

  const sessionDir = config.sessions.persist
    ? path.isAbsolute(config.sessions.dir)
      ? config.sessions.dir
      : path.join(process.cwd(), config.sessions.dir)
    : undefined;
  const sessionStore = new SessionStore(sessionDir);
  const sessionManager = new SessionManager(sessionStore);

  const allowlistPath = config.security.allowlistPath?.trim();
  const resolvedAllowlistPath = allowlistPath
    ? path.isAbsolute(allowlistPath)
      ? allowlistPath
      : path.join(process.cwd(), allowlistPath)
    : undefined;
  const allowlist = resolvedAllowlistPath ? Allowlist.fromFile(resolvedAllowlistPath) : undefined;

  const agentService = new AgentService({
    runtime,
    sessions: sessionManager,
    allowlist
  });

  const gateway = createGateway({
    port: config.gateway.port,
    handler: {
      onText: async ({ userId, channel, text }) => {
        return agentService.handleMessage({
          channel,
          userId,
          text,
          timestamp: new Date().toISOString()
        });
      }
    }
  });

  gateway.app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  if (config.channels.webchat?.enabled) {
    const distDir = path.join(process.cwd(), "dist", "channels", "webchat", "static");
    const srcDir = path.join(process.cwd(), "src", "channels", "webchat", "static");
    const staticDir = fs.existsSync(distDir) ? distDir : srcDir;
    registerWebChat(gateway.app, staticDir);
  }

  gateway.start();

  if (config.channels.telegram?.enabled) {
    try {
      const bot = createTelegramBot(config.channels.telegram, agentService);
      bot.start();
      logger.info("Telegram bot started");
    } catch (error) {
      logger.error("Telegram bot failed to start", error);
    }
  }

  if (config.channels.discord?.enabled) {
    try {
      const client = await createDiscordClient(config.channels.discord, agentService);
      const token = assertNonEmpty(config.channels.discord.token, "DISCORD_BOT_TOKEN");
      await client.login(token);
      logger.info("Discord bot started");
    } catch (error) {
      logger.error("Discord bot failed to start", error);
    }
  }
}

main().catch((error) => {
  logger.error("Fatal error", error);
  process.exit(1);
});
