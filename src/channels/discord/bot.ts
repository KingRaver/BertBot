export interface DiscordChannelConfig {
  enabled: boolean;
  token?: string;
}

export function createDiscordClient(_config: DiscordChannelConfig): never {
  throw new Error("Discord support not installed. Add discord.js and implement handlers.");
}
