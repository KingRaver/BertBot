import { z } from "zod";

const providerSchema = z.object({
  type: z.enum(["openai", "anthropic"]),
  apiKey: z.string().optional(),
  model: z.string().optional()
});

const channelToggleSchema = z.object({
  enabled: z.boolean()
});

const telegramSchema = channelToggleSchema.extend({
  token: z.string().optional()
});

const discordSchema = channelToggleSchema.extend({
  token: z.string().optional()
});

const slackSchema = channelToggleSchema.extend({
  token: z.string().optional()
});

const webchatSchema = channelToggleSchema;

export const appConfigSchema = z.object({
  gateway: z.object({
    port: z.number().int().positive()
  }),
  provider: providerSchema,
  channels: z.object({
    telegram: telegramSchema.optional(),
    discord: discordSchema.optional(),
    slack: slackSchema.optional(),
    webchat: webchatSchema.optional()
  })
});

export type AppConfigSchema = z.infer<typeof appConfigSchema>;
