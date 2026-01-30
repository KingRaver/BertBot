import { Bot } from "grammy";
import { setupTelegramHandlers } from "./handlers";
import type { TelegramChannelConfig } from "./types";
import { assertNonEmpty } from "../../utils/validators";

export function createTelegramBot(config: TelegramChannelConfig): Bot {
  const token = assertNonEmpty(config.token, "TELEGRAM_BOT_TOKEN");
  const bot = new Bot(token);
  setupTelegramHandlers(bot);
  return bot;
}
