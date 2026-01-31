export type ProviderType = "openai" | "anthropic" | "perplexity";

export interface ProviderConfig {
  type: ProviderType;
  apiKey?: string;
  model?: string;
}

export interface SessionsConfig {
  persist: boolean;
  dir: string;
}

export interface SecurityConfig {
  allowlistPath?: string;
}

export interface NotionConfig {
  enabled: boolean;
  apiKey?: string;
  databaseId?: string;
  defaultParentId?: string;
}

export interface ChannelToggle {
  enabled: boolean;
}

export interface TelegramConfig extends ChannelToggle {
  token?: string;
}

export interface DiscordConfig extends ChannelToggle {
  token?: string;
  allowedGuilds?: string[];
  allowDMs?: boolean;
}

export type SlackMode = "socket" | "http";

export interface SlackConfig extends ChannelToggle {
  token?: string;
  appToken?: string;
  signingSecret?: string;
  mode?: SlackMode;
  allowedChannels?: string[];
  allowDMs?: boolean;
  mentionOnly?: boolean;
  respondInThread?: boolean;
  ignoreBots?: boolean;
}

export interface TeamsConfig extends ChannelToggle {
  appId?: string;
  appPassword?: string;
  endpoint?: string;
  allowedTeams?: string[];
  allowedChannels?: string[];
  allowPersonal?: boolean;
  allowGroup?: boolean;
  allowChannel?: boolean;
  mentionOnly?: boolean;
  ignoreBots?: boolean;
}

export interface SignalConfig extends ChannelToggle {
  account?: string;
  cliPath?: string;
  allowedRecipients?: string[];
  allowedGroups?: string[];
  allowDMs?: boolean;
  allowGroups?: boolean;
  ignoreOwn?: boolean;
  mentionOnly?: boolean;
  commandPrefix?: string;
}

export interface WebChatConfig extends ChannelToggle {}

export interface AppConfig {
  gateway: {
    port: number;
  };
  provider: ProviderConfig;
  sessions: SessionsConfig;
  security: SecurityConfig;
  notion: NotionConfig;
  channels: {
    telegram?: TelegramConfig;
    discord?: DiscordConfig;
    slack?: SlackConfig;
    teams?: TeamsConfig;
    signal?: SignalConfig;
    webchat?: WebChatConfig;
  };
}
