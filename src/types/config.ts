export type ProviderType = "openai" | "anthropic";

export interface ProviderConfig {
  type: ProviderType;
  apiKey?: string;
  model?: string;
}

export interface ChannelToggle {
  enabled: boolean;
}

export interface TelegramConfig extends ChannelToggle {
  token?: string;
}

export interface DiscordConfig extends ChannelToggle {
  token?: string;
}

export interface SlackConfig extends ChannelToggle {
  token?: string;
}

export interface WebChatConfig extends ChannelToggle {}

export interface AppConfig {
  gateway: {
    port: number;
  };
  provider: ProviderConfig;
  channels: {
    telegram?: TelegramConfig;
    discord?: DiscordConfig;
    slack?: SlackConfig;
    webchat?: WebChatConfig;
  };
}
