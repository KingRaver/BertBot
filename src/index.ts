import path from "path";
import fs from "fs";
import { createGateway } from "./gateway/server";
import { registerWebChat } from "./channels/webchat/server";
import { createTelegramBot } from "./channels/telegram/bot";
import { loadConfig } from "./config/loader";
import { logger } from "./utils/logger";

async function main(): Promise<void> {
  const config = loadConfig();

  const gateway = createGateway({ port: config.gateway.port });

  if (config.channels.webchat?.enabled) {
    const distDir = path.join(process.cwd(), "dist", "channels", "webchat", "static");
    const srcDir = path.join(process.cwd(), "src", "channels", "webchat", "static");
    const staticDir = fs.existsSync(distDir) ? distDir : srcDir;
    registerWebChat(gateway.app, staticDir);
  }

  gateway.start();

  if (config.channels.telegram?.enabled) {
    try {
      const bot = createTelegramBot(config.channels.telegram);
      bot.start();
      logger.info("Telegram bot started");
    } catch (error) {
      logger.error("Telegram bot failed to start", error);
    }
  }
}

main().catch((error) => {
  logger.error("Fatal error", error);
  process.exit(1);
});
