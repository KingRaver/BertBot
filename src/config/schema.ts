import { z } from "zod";

const providerSchema = z.object({
  type: z.enum(["openai", "anthropic", "perplexity"]),
  apiKey: z.string().optional(),
  model: z.string().optional()
});

const notionSchema = z.object({
  enabled: z.boolean(),
  apiKey: z.string().optional(),
  databaseId: z.string().optional(),
  defaultParentId: z.string().optional()
});

const channelToggleSchema = z.object({
  enabled: z.boolean()
});

const telegramSchema = channelToggleSchema.extend({
  token: z.string().optional()
});

const discordSchema = channelToggleSchema.extend({
  token: z.string().optional(),
  allowedGuilds: z.array(z.string()).optional(),
  allowDMs: z.boolean().optional()
});

const slackSchema = channelToggleSchema.extend({
  token: z.string().optional(),
  appToken: z.string().optional(),
  signingSecret: z.string().optional(),
  mode: z.enum(["socket", "http"]).optional(),
  allowedChannels: z.array(z.string()).optional(),
  allowDMs: z.boolean().optional(),
  mentionOnly: z.boolean().optional(),
  respondInThread: z.boolean().optional(),
  ignoreBots: z.boolean().optional()
});

const teamsSchema = channelToggleSchema.extend({
  appId: z.string().optional(),
  appPassword: z.string().optional(),
  endpoint: z.string().optional(),
  allowedTeams: z.array(z.string()).optional(),
  allowedChannels: z.array(z.string()).optional(),
  allowPersonal: z.boolean().optional(),
  allowGroup: z.boolean().optional(),
  allowChannel: z.boolean().optional(),
  mentionOnly: z.boolean().optional(),
  ignoreBots: z.boolean().optional()
});

const signalSchema = channelToggleSchema.extend({
  account: z.string().optional(),
  cliPath: z.string().optional(),
  allowedRecipients: z.array(z.string()).optional(),
  allowedGroups: z.array(z.string()).optional(),
  allowDMs: z.boolean().optional(),
  allowGroups: z.boolean().optional(),
  ignoreOwn: z.boolean().optional(),
  mentionOnly: z.boolean().optional(),
  commandPrefix: z.string().optional()
});

const webchatSchema = channelToggleSchema;

export const appConfigSchema = z.object({
  gateway: z.object({
    port: z.number().int().positive()
  }),
  provider: providerSchema,
  sessions: z.object({
    persist: z.boolean(),
    dir: z.string()
  }),
  security: z.object({
    allowlistPath: z.string().optional()
  }),
  notion: notionSchema,
  channels: z.object({
    telegram: telegramSchema.optional(),
    discord: discordSchema.optional(),
    slack: slackSchema.optional(),
    teams: teamsSchema.optional(),
    signal: signalSchema.optional(),
    webchat: webchatSchema.optional()
  })
});

export type AppConfigSchema = z.infer<typeof appConfigSchema>;
