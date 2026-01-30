import type { Client, Message } from "discord.js";
import type { AgentService } from "../../agent/service";
import type { DiscordChannelConfig } from "./bot";

function isAllowedGuild(config: DiscordChannelConfig, message: Message): boolean {
  if (!message.guild || !config.allowedGuilds || config.allowedGuilds.length === 0) {
    return true;
  }
  return config.allowedGuilds.includes(message.guild.id);
}

export function registerDiscordHandlers(client: Client, agent: AgentService, config: DiscordChannelConfig): void {
  client.on("messageCreate", async (message) => {
    if (message.author.bot) {
      return;
    }

    if (!message.guild && config.allowDMs === false) {
      return;
    }

    if (!isAllowedGuild(config, message)) {
      return;
    }

    const text = message.content ?? "";
    if (!text.trim()) {
      return;
    }

    try {
      const response = await agent.handleMessage({
        channel: "discord",
        userId: message.author.id,
        text,
        timestamp: new Date().toISOString()
      });
      for (const chunk of splitText(response, 1900)) {
        await message.reply(chunk);
      }
    } catch (error) {
      await message.reply("Sorry, something went wrong.");
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
