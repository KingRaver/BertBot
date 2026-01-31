import { ActivityHandler, TurnContext } from "botbuilder";
import type { AgentService } from "@agent/service";
import type { TeamsConfig } from "@types/config";
import { logger } from "@utils/logger";
import { getUserMessage } from "@utils/errors";

interface TeamsChannelData {
  team?: { id?: string };
  channel?: { id?: string };
  tenant?: { id?: string };
}

export class TeamsBot extends ActivityHandler {
  private agent: AgentService;
  private config: TeamsConfig;

  constructor(agent: AgentService, config: TeamsConfig) {
    super();
    this.agent = agent;
    this.config = config;

    this.onMessage(async (context, next) => {
      const handled = await this.handleMessage(context);
      if (!handled) {
        await next();
        return;
      }
      await next();
    });
  }

  private async handleMessage(context: TurnContext): Promise<boolean> {
    const activity = context.activity;

    if (!activity || !activity.text) {
      return false;
    }

    if (this.isBotMessage(context) && (this.config.ignoreBots ?? true)) {
      return false;
    }

    const conversationType = activity.conversation?.conversationType ?? "personal";

    if (conversationType === "personal" && this.config.allowPersonal === false) {
      return false;
    }

    if (conversationType === "groupChat" && this.config.allowGroup === false) {
      return false;
    }

    if (conversationType === "channel" && this.config.allowChannel === false) {
      return false;
    }

    const channelData = (activity.channelData ?? {}) as TeamsChannelData;
    const teamId = channelData.team?.id;
    const channelId = channelData.channel?.id;

    if (conversationType === "channel") {
      if (!this.isTeamAllowed(teamId)) {
        return false;
      }
      if (!this.isChannelAllowed(channelId)) {
        return false;
      }
    }

    const mentionOnly = this.config.mentionOnly ?? false;
    const isMentioned = this.wasBotMentioned(context);
    if ((conversationType === "channel" || conversationType === "groupChat") && mentionOnly && !isMentioned) {
      return false;
    }

    const text = this.cleanText(activity.text);
    if (!text.trim()) {
      return false;
    }

    const userId = this.buildUserId(context, conversationType);

    try {
      const response = await this.agent.handleMessage({
        channel: "teams",
        userId,
        text,
        timestamp: new Date().toISOString()
      });

      for (const chunk of splitText(response, 3000)) {
        await context.sendActivity(chunk);
      }
    } catch (error) {
      logger.error("Teams handler error", error);
      await context.sendActivity(getUserMessage(error));
    }

    return true;
  }

  private buildUserId(context: TurnContext, conversationType: string): string {
    const activity = context.activity;
    const channelData = (activity.channelData ?? {}) as TeamsChannelData;
    const tenantId = channelData.tenant?.id;
    const fromId = activity.from?.id ?? "unknown";
    const conversationId = activity.conversation?.id ?? "conversation";

    const scope = conversationType === "personal" ? fromId : `${fromId}:${conversationId}`;
    return [tenantId, scope].filter(Boolean).join(":");
  }

  private isBotMessage(context: TurnContext): boolean {
    const activity = context.activity;
    if (!activity.from) {
      return false;
    }

    if (activity.from.role === "bot") {
      return true;
    }

    if (activity.recipient && activity.from.id === activity.recipient.id) {
      return true;
    }

    return false;
  }

  private wasBotMentioned(context: TurnContext): boolean {
    const activity = context.activity;
    const botId = activity.recipient?.id;
    if (!botId) {
      return false;
    }

    const entities = activity.entities ?? [];
    return entities.some((entity: any) => {
      if (entity.type !== "mention") {
        return false;
      }
      const mentionedId = entity.mentioned?.id;
      return mentionedId === botId;
    });
  }

  private cleanText(text: string): string {
    return text.replace(/<at>.*?<\/at>/gi, "").replace(/\s+/g, " ").trim();
  }

  private isTeamAllowed(teamId?: string): boolean {
    const allowed = this.config.allowedTeams ?? [];
    if (allowed.length === 0) {
      return true;
    }
    if (!teamId) {
      return false;
    }
    return allowed.includes(teamId);
  }

  private isChannelAllowed(channelId?: string): boolean {
    const allowed = this.config.allowedChannels ?? [];
    if (allowed.length === 0) {
      return true;
    }
    if (!channelId) {
      return false;
    }
    return allowed.includes(channelId);
  }
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
