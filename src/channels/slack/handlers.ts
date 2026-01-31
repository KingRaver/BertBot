import type { App } from "@slack/bolt";
import type { AgentService } from "@agent/service";
import type { SlackConfig } from "@types/config";

interface SlackMessage {
  text?: string;
  user?: string;
  bot_id?: string;
  subtype?: string;
  channel?: string;
  channel_type?: string;
  thread_ts?: string;
  ts?: string;
}

interface SlackCommand {
  text: string;
  user_id: string;
  team_id: string;
  channel_id: string;
  channel_name?: string;
}

export function registerSlackHandlers(app: App, agent: AgentService, config: SlackConfig): void {
  const allowDMs = config.allowDMs ?? true;
  const mentionOnly = config.mentionOnly ?? false;
  const respondInThread = config.respondInThread ?? true;
  const ignoreBots = config.ignoreBots ?? true;
  const allowedChannels = config.allowedChannels ?? [];

  const isChannelAllowed = (channelId?: string, channelType?: string): boolean => {
    if (!channelId) {
      return false;
    }
    if (channelType === "im") {
      return allowDMs;
    }
    if (allowedChannels.length === 0) {
      return true;
    }
    return allowedChannels.includes(channelId);
  };

  const buildUserId = (teamId: string | undefined, channelId: string | undefined, userId: string): string => {
    return `${teamId ?? "slack"}:${channelId ?? "channel"}:${userId}`;
  };

  const respond = async (params: {
    text: string;
    userId: string;
    teamId?: string;
    channelId?: string;
    channelType?: string;
    threadTs?: string;
    say: (message: { text: string; thread_ts?: string }) => Promise<void>;
  }) => {
    if (!params.text.trim()) {
      return;
    }

    if (!isChannelAllowed(params.channelId, params.channelType)) {
      return;
    }

    const sessionUserId = buildUserId(params.teamId, params.channelId, params.userId);
    const response = await agent.handleMessage({
      channel: "slack",
      userId: sessionUserId,
      text: params.text,
      timestamp: new Date().toISOString()
    });

    const threadTs = respondInThread && params.channelType !== "im" ? params.threadTs : undefined;
    for (const chunk of splitText(response, 2900)) {
      await params.say({ text: chunk, thread_ts: threadTs });
    }
  };

  app.event("app_mention", async ({ event, context, say }) => {
    const data = event as SlackMessage & { user?: string; channel?: string; team?: string };
    if (!data.user || !data.text) {
      return;
    }

    const cleaned = stripMention(data.text, context.botUserId);

    await respond({
      text: cleaned,
      userId: data.user,
      teamId: context.teamId ?? data.team,
      channelId: data.channel,
      channelType: data.channel_type,
      threadTs: data.thread_ts ?? data.ts,
      say
    });
  });

  app.message(async ({ message, context, say }) => {
    const data = message as SlackMessage;
    if (!data.text || !data.user) {
      return;
    }

    if (data.subtype && data.subtype !== "bot_message") {
      return;
    }

    if (ignoreBots && (data.bot_id || data.subtype === "bot_message")) {
      return;
    }

    if (mentionOnly && data.channel_type !== "im") {
      return;
    }

    if (context.botUserId && data.text.includes(`<@${context.botUserId}>`)) {
      return;
    }

    const text = mentionOnly ? stripMention(data.text, context.botUserId) : data.text;

    await respond({
      text,
      userId: data.user,
      teamId: context.teamId,
      channelId: data.channel,
      channelType: data.channel_type,
      threadTs: data.thread_ts ?? data.ts,
      say
    });
  });

  app.command("/bert", async ({ command, ack, respond }) => {
    await ack();
    const data = command as SlackCommand;

    if (!allowDMs && data.channel_name === "directmessage") {
      return;
    }

    if (allowedChannels.length > 0 && !allowedChannels.includes(data.channel_id)) {
      return;
    }

    const sessionUserId = buildUserId(data.team_id, data.channel_id, data.user_id);
    const responseText = await agent.handleMessage({
      channel: "slack",
      userId: sessionUserId,
      text: data.text,
      timestamp: new Date().toISOString()
    });

    for (const chunk of splitText(responseText, 2900)) {
      await respond(chunk);
    }
  });
}

function stripMention(text: string, botUserId?: string): string {
  if (!botUserId) {
    return text;
  }
  const mention = `<@${botUserId}>`;
  return text.split(mention).join("").trim();
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
