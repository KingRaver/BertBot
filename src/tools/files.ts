import path from "path";
import fs from "fs/promises";

interface FilesToolInput {
  action: "read" | "write";
  path: string;
  content?: string;
}

function resolvePath(targetPath: string): string {
  const resolved = path.resolve(process.cwd(), targetPath);
  const relative = path.relative(process.cwd(), resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Path is outside workspace");
  }
  return resolved;
}

export async function runFilesTool(input: string): Promise<string> {
  let payload: FilesToolInput;
  try {
    payload = JSON.parse(input) as FilesToolInput;
  } catch (error) {
    throw new Error("Invalid JSON for files tool");
  }
  if (!payload.path) {
    throw new Error("Missing path for files tool");
  }
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
