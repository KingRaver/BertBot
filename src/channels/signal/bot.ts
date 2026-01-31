import { spawn } from "child_process";
import readline from "readline";
import type { ChildProcessWithoutNullStreams } from "child_process";
import type { AgentService } from "@agent/service";
import type { SignalConfig } from "@types/config";
import { assertNonEmpty } from "@utils/validators";
import { logger } from "@utils/logger";
import { getUserMessage } from "@utils/errors";

interface SignalEnvelope {
  source?: string;
  sourceNumber?: string;
  sourceName?: string;
  dataMessage?: {
    message?: string;
    body?: string;
    groupInfo?: {
      groupId?: string;
    };
  };
}

interface SignalPayload {
  envelope?: SignalEnvelope;
  dataMessage?: SignalEnvelope["dataMessage"];
  source?: string;
  message?: string;
}

interface SignalMessage {
  source: string;
  text: string;
  groupId?: string;
}

export interface SignalBridge {
  start: () => void;
  stop: () => void;
}

export function createSignalBridge(config: SignalConfig, agent: AgentService): SignalBridge {
  const account = assertNonEmpty(config.account, "SIGNAL_ACCOUNT");
  const cliPath = config.cliPath?.trim() || "signal-cli";
  const allowDMs = config.allowDMs ?? true;
  const allowGroups = config.allowGroups ?? true;
  const ignoreOwn = config.ignoreOwn ?? true;
  const allowedRecipients = config.allowedRecipients ?? [];
  const allowedGroups = config.allowedGroups ?? [];
  const mentionOnly = config.mentionOnly ?? false;
  const commandPrefix = config.commandPrefix?.trim() || "/bert";

  let child: ChildProcessWithoutNullStreams | undefined;
  let stopped = false;
  let retryCount = 0;

  const start = () => {
    stopped = false;
    spawnListener();
  };

  const stop = () => {
    stopped = true;
    if (child) {
      child.kill();
      child = undefined;
    }
  };

  const spawnListener = () => {
    if (stopped) {
      return;
    }

    logger.info("Starting Signal listener", { cliPath });
    child = spawn(cliPath, ["-u", account, "receive", "--json"], {
      stdio: ["ignore", "pipe", "pipe"]
    });

    retryCount = 0;

    child.on("error", (error) => {
      logger.error("Signal CLI spawn error", error);
      scheduleRestart();
    });

    const rl = readline.createInterface({
      input: child.stdout,
      crlfDelay: Infinity
    });

    rl.on("line", (line) => {
      void handleLine(line);
    });

    child.stderr.on("data", (data) => {
      logger.warn("Signal CLI stderr", data.toString());
    });

    child.on("exit", (code, signal) => {
      rl.close();
      child = undefined;
      if (!stopped) {
        logger.warn("Signal CLI exited", { code, signal });
        scheduleRestart();
      }
    });
  };

  const scheduleRestart = () => {
    if (stopped) {
      return;
    }
    retryCount += 1;
    const delay = Math.min(30000, 1000 * Math.pow(2, retryCount));
    logger.warn(`Restarting Signal listener in ${delay}ms`);
    setTimeout(() => spawnListener(), delay);
  };

  const handleLine = async (line: string) => {
    const message = parseSignalMessage(line);
    if (!message) {
      return;
    }

    if (!isMessageAllowed(message)) {
      return;
    }

    if (ignoreOwn && message.source === account) {
      return;
    }

    let text = message.text;
    if (mentionOnly) {
      if (!text.toLowerCase().startsWith(commandPrefix.toLowerCase())) {
        return;
      }
      text = text.slice(commandPrefix.length).trim();
      if (!text) {
        return;
      }
    }

    const userId = message.groupId ? `group:${message.groupId}:${message.source}` : message.source;

    try {
      const response = await agent.handleMessage({
        channel: "signal",
        userId,
        text,
        timestamp: new Date().toISOString()
      });

      const chunks = splitText(response, 1800);
      for (const chunk of chunks) {
        await sendSignalMessage(cliPath, account, chunk, message);
      }
    } catch (error) {
      logger.error("Signal handler error", error);
      const fallback = getUserMessage(error);
      try {
        await sendSignalMessage(cliPath, account, fallback, message);
      } catch (sendError) {
        logger.error("Signal send error", sendError);
      }
    }
  };

  const isMessageAllowed = (message: SignalMessage): boolean => {
    if (message.groupId) {
      if (!allowGroups) {
        return false;
      }
      if (allowedGroups.length === 0) {
        return true;
      }
      return allowedGroups.includes(message.groupId);
    }

    if (!allowDMs) {
      return false;
    }
    if (allowedRecipients.length === 0) {
      return true;
    }
    return allowedRecipients.includes(message.source);
  };

  return { start, stop };
}

function parseSignalMessage(line: string): SignalMessage | null {
  const trimmed = line.trim();
  if (!trimmed) {
    return null;
  }

  let payload: SignalPayload;
  try {
    payload = JSON.parse(trimmed) as SignalPayload;
  } catch (error) {
    return null;
  }

  const envelope = payload.envelope ?? payload;
  const dataMessage = envelope.dataMessage ?? payload.dataMessage ?? {};
  const text = dataMessage.message ?? dataMessage.body ?? payload.message;
  const source = envelope.sourceNumber ?? envelope.source ?? payload.source;
  const groupId = dataMessage.groupInfo?.groupId;

  if (!text || !source) {
    return null;
  }

  return { source, text, groupId };
}

async function sendSignalMessage(
  cliPath: string,
  account: string,
  text: string,
  target: SignalMessage
): Promise<void> {
  const args = ["-u", account, "send", "-m", text];

  if (target.groupId) {
    args.push("-g", target.groupId);
  } else {
    args.push(target.source);
  }

  await new Promise<void>((resolve, reject) => {
    const child = spawn(cliPath, args, { stdio: "ignore" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`signal-cli exited with code ${code ?? "unknown"}`));
      }
    });
  });
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
