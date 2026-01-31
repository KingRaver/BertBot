import type { Express } from "express";
import express from "express";
import { BotFrameworkAdapter } from "botbuilder";
import type { AgentService } from "@agent/service";
import type { TeamsConfig } from "@types/config";
import { assertNonEmpty } from "@utils/validators";
import { logger } from "@utils/logger";
import { getUserMessage } from "@utils/errors";
import { TeamsBot } from "./handlers";

export interface TeamsAppInstance {
  adapter: BotFrameworkAdapter;
  endpoint: string;
}

function normalizeEndpoint(endpoint?: string): string {
  if (!endpoint || endpoint.trim().length === 0) {
    return "/teams/messages";
  }
  return endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
}

export function registerTeams(
  app: Express,
  agent: AgentService,
  config: TeamsConfig
): TeamsAppInstance {
  const appId = assertNonEmpty(config.appId, "TEAMS_APP_ID");
  const appPassword = assertNonEmpty(config.appPassword, "TEAMS_APP_PASSWORD");
  const endpoint = normalizeEndpoint(config.endpoint);

  const adapter = new BotFrameworkAdapter({
    appId,
    appPassword
  });

  adapter.onTurnError = async (context, error) => {
    logger.error("Teams adapter error", error);
    await context.sendActivity(getUserMessage(error));
  };

  const bot = new TeamsBot(agent, config);

  app.post(endpoint, express.json({ limit: "1mb" }), (req, res) => {
    adapter.processActivity(req, res, async (context) => {
      await bot.run(context);
    });
  });

  logger.info("Teams endpoint registered", { endpoint });

  return { adapter, endpoint };
}
