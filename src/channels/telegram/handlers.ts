import type { Bot, Context } from "grammy";

export function setupTelegramHandlers(bot: Bot<Context>): void {
  bot.command("ping", (ctx) => ctx.reply("pong"));
  bot.on("message:text", (ctx) => ctx.reply(`You said: ${ctx.message.text}`));
}
