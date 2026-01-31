import type { Bot, Context } from "grammy";
import type { AgentService } from "@agent/service";
import { getUserMessage } from "@utils/errors";
import { logger } from "@utils/logger";

export function setupTelegramHandlers(bot: Bot<Context>, agent: AgentService): void {
  bot.command("ping", (ctx) => ctx.reply("pong"));
  bot.on("message:text", async (ctx) => {
    const userId = String(ctx.from?.id ?? "unknown");
    const text = ctx.message.text ?? "";
    if (!text.trim()) {
      return;
    }

    try {
      const response = await agent.handleMessage({
        channel: "telegram",
        userId,
        text,
        timestamp: new Date().toISOString()
      });
      for (const chunk of splitText(response, 3900)) {
        await ctx.reply(chunk);
      }
    } catch (error) {
      logger.error("Telegram handler error", { error, userId, text: text.substring(0, 100) });
      await ctx.reply(getUserMessage(error));
    }
  });
}

function splitText(text: string, maxLength: number): string[] {
  if (text.length <= maxLength) {
    return [text];
  }
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    chunks.push(text.slice(start, start + maxLength));
    start += maxLength;
  }
  return chunks;
}
