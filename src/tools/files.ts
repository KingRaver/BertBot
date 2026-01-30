import path from "path";
import fs from "fs/promises";

interface FilesToolInput {
  action: "read" | "write";
  path: string;
  content?: string;
}

function resolvePath(targetPath: string): string {
  const resolved = path.resolve(process.cwd(), targetPath);
  if (!resolved.startsWith(process.cwd())) {
    throw new Error("Path is outside workspace");
  }
  return resolved;
}

export async function runFilesTool(input: string): Promise<string> {
  const payload = JSON.parse(input) as FilesToolInput;
  const resolved = resolvePath(payload.path);

  if (payload.action === "read") {
    return fs.readFile(resolved, "utf8");
  }

  if (payload.action === "write") {
    if (typeof payload.content !== "string") {
      throw new Error("Missing content for write action");
    }
    await fs.mkdir(path.dirname(resolved), { recursive: true });
    await fs.writeFile(resolved, payload.content, "utf8");
    return "ok";
  }

  throw new Error("Unsupported files tool action");
}
