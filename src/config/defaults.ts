import type { AppConfig } from "../types/config";

export const defaultConfig: AppConfig = {
  gateway: {
    port: 18789
  },
  provider: {
    type: "perplexity",
    model: "sonar-pro"
  },
  sessions: {
    persist: false,
    dir: "data/sessions"
  },
  security: {
    allowlistPath: ""
  },
  channels: {
    telegram: {
      enabled: false
    },
    discord: {
      enabled: false,
      allowDMs: true
    },
    slack: {
      enabled: false,
      mode: "socket",
      allowDMs: true,
      mentionOnly: false,
      respondInThread: true,
      ignoreBots: true,
      allowedChannels: []
    },
    webchat: {
      enabled: true
    }
  }
};
