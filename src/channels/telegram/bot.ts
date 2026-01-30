import { Bot } from "grammy";
import { setupTelegramHandlers } from "./handlers";
import type { TelegramChannelConfig } from "./types";
import { assertNonEmpty } from "../../utils/validators";
import type { AgentService } from "../../agent/service";

export function createTelegramBot(config: TelegramChannelConfig, agent: AgentService): Bot {
  const token = assertNonEmpty(config.token, "TELEGRAM_BOT_TOKEN");
  const bot = new Bot(token);
  setupTelegramHandlers(bot, agent);
  return bot;
}
