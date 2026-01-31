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
  notion: {
    enabled: false,
    databaseId: "",
    defaultParentId: ""
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
    teams: {
      enabled: false,
      endpoint: "/teams/messages",
      allowPersonal: true,
      allowGroup: true,
      allowChannel: true,
      mentionOnly: false,
      ignoreBots: true,
      allowedTeams: [],
      allowedChannels: []
    },
    signal: {
      enabled: false,
      cliPath: "signal-cli",
      allowDMs: true,
      allowGroups: true,
      ignoreOwn: true,
      mentionOnly: false,
      commandPrefix: "/bert",
      allowedRecipients: [],
      allowedGroups: []
    },
    webchat: {
      enabled: true
    }
  }
};
