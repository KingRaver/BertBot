import path from "path";
import fs from "fs/promises";

interface FilesToolInput {
  action: "read" | "write";
  path: string;
  content?: string;
}

async function resolvePath(targetPath: string): Promise<string> {
  // Sanitize input
  if (!targetPath || typeof targetPath !== "string") {
    throw new Error("Invalid path");
  }

  // Remove null bytes and other dangerous characters
  const sanitized = targetPath.replace(/\0/g, "").trim();
  if (!sanitized) {
    throw new Error("Invalid path");
  }

  // Resolve to absolute path
  const workspaceRoot = process.cwd();
  const resolved = path.resolve(workspaceRoot, sanitized);

  // Get real path (follows symlinks) to detect symlink attacks
  let realPath: string;
  try {
    // Check if file exists first
    await fs.access(resolved);
    realPath = await fs.realpath(resolved);
  } catch (err) {
    // File doesn't exist yet (for writes), check parent directory
    const parentDir = path.dirname(resolved);
    try {
      const realParent = await fs.realpath(parentDir);
      realPath = path.join(realParent, path.basename(resolved));
    } catch {
      // Parent doesn't exist either, use resolved path for now
      // (will be created during write operations)
      realPath = resolved;
    }
  }

  // Verify the real path is within workspace
  const relative = path.relative(workspaceRoot, realPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Path is outside workspace");
  }

  return realPath;
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
  const resolved = await resolvePath(payload.path);

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
