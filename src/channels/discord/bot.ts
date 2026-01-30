import type { Client } from "discord.js";
import type { AgentService } from "../../agent/service";
import type { DiscordConfig } from "../../types/config";
import { registerDiscordHandlers } from "./handlers";

export type DiscordChannelConfig = DiscordConfig;

export async function createDiscordClient(
  config: DiscordChannelConfig,
  agent: AgentService
): Promise<Client> {
  const mod = await import("discord.js");
  const { Client, GatewayIntentBits, Partials } = mod as typeof import("discord.js");

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
  });

  registerDiscordHandlers(client, agent, config);

  return client;
}
