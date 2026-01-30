export interface SlackChannelConfig {
  enabled: boolean;
  token?: string;
  appToken?: string;
  signingSecret?: string;
}

export function createSlackApp(_config: SlackChannelConfig): never {
  throw new Error("Slack support not installed. Add @slack/bolt and implement handlers.");
}
