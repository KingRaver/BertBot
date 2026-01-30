import { exec } from "child_process";
import { isCommandAllowed } from "../security/sandbox";

export async function runBashTool(command: string): Promise<string> {
  if (!isCommandAllowed(command)) {
    throw new Error("Command blocked by sandbox policy");
  }
  return new Promise((resolve, reject) => {
    exec(command, { timeout: 10_000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout || stderr || "");
    });
  });
}
