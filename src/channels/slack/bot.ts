import type { Express } from "express";
import type { AgentService } from "@agent/service";
import type { SlackConfig, SlackMode } from "@types/config";
import { assertNonEmpty } from "@utils/validators";
import { registerSlackHandlers } from "./handlers";

export type SlackChannelConfig = SlackConfig;

export interface SlackAppInstance {
  start: () => Promise<void>;
}

function resolveMode(config: SlackChannelConfig): SlackMode {
  if (config.mode) {
    return config.mode;
  }
  return config.appToken ? "socket" : "http";
}

export async function createSlackApp(
  config: SlackChannelConfig,
  agent: AgentService,
  expressApp?: Express
): Promise<SlackAppInstance> {
  const { App, ExpressReceiver } = (await import("@slack/bolt")) as typeof import("@slack/bolt");

  const token = assertNonEmpty(config.token, "SLACK_BOT_TOKEN");
  const mode = resolveMode(config);

  let app: InstanceType<typeof App>;
  let start = async () => {};

  if (mode === "socket") {
    const appToken = assertNonEmpty(config.appToken, "SLACK_APP_TOKEN");
    app = new App({
      token,
      appToken,
      socketMode: true
    });
    start = async () => {
      await app.start(0);
    };
  } else {
    const signingSecret = assertNonEmpty(config.signingSecret, "SLACK_SIGNING_SECRET");
    const receiver = new ExpressReceiver({ signingSecret });
    app = new App({
      token,
      receiver
    });

    if (expressApp) {
      expressApp.use("/slack/events", receiver.router);
    }

    start = async () => {
      if (!expressApp) {
        await app.start();
      }
    };
  }

  registerSlackHandlers(app, agent, config);

  return { start };
}
