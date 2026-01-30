import { exec } from "child_process";

export async function runBashTool(command: string): Promise<string> {
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
