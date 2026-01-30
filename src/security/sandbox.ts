// Whitelist approach: only allow safe, read-only commands
const ALLOWED_COMMANDS = new Set([
  // File system (read-only)
  "ls", "cat", "head", "tail", "find", "tree", "file", "stat", "wc",
  // Text processing
  "grep", "sed", "awk", "cut", "sort", "uniq", "diff", "patch",
  // System info (safe)
  "pwd", "whoami", "date", "uptime", "uname", "hostname", "env", "printenv",
  // Process info (read-only)
  "ps", "top", "df", "du", "free",
  // Network (read-only)
  "ping", "traceroute", "nslookup", "dig", "host", "whois",
  // Output
  "echo", "printf",
  // Archives (read-only)
  "tar", "zip", "unzip", "gzip", "gunzip", "bzip2", "bunzip2",
  // Git (read-only)
  "git"
]);

// Additional commands that require specific argument validation
const CONDITIONALLY_ALLOWED: { [key: string]: (args: string) => boolean } = {
  // git: only allow read operations
  "git": (args: string) => {
    const gitReadCommands = ["status", "log", "diff", "show", "branch", "remote", "ls-files", "ls-tree", "rev-parse"];
    return gitReadCommands.some(cmd => args.trim().startsWith(cmd));
  },
  // tar: only allow listing/extracting, not creating (which could overwrite)
  "tar": (args: string) => {
    return args.includes("-t") || args.includes("--list"); // List only
  }
};

export function isCommandAllowed(command: string): boolean {
  const trimmed = command.trim();
  if (!trimmed) return false;

  // Extract the base command (first token)
  const tokens = trimmed.split(/\s+/);
  const baseCmd = tokens[0].toLowerCase();

  // Remove path from command (e.g., /bin/ls -> ls)
  const cmdName = baseCmd.split("/").pop() || baseCmd;

  // Check for dangerous shell features
  if (hasDangerousShellFeatures(command)) {
    return false;
  }

  // Check whitelist
  if (ALLOWED_COMMANDS.has(cmdName)) {
    return true;
  }

  // Check conditional commands
  if (cmdName in CONDITIONALLY_ALLOWED) {
    const args = tokens.slice(1).join(" ");
    return CONDITIONALLY_ALLOWED[cmdName](args);
  }

  // Default deny
  return false;
}

function hasDangerousShellFeatures(command: string): boolean {
  // Block command chaining
  if (command.includes(";") || command.includes("&&") || command.includes("||")) {
    return true;
  }

  // Block pipes (could be used to bypass whitelist)
  if (command.includes("|") && !isInQuotes(command, command.indexOf("|"))) {
    return true;
  }

  // Block redirects (could overwrite files)
  if (command.includes(">") || command.includes("<")) {
    return true;
  }

  // Block command substitution
  if (command.includes("$(") || command.includes("`")) {
    return true;
  }

  // Block background execution
  if (command.trim().endsWith("&")) {
    return true;
  }

  return false;
}

function isInQuotes(str: string, position: number): boolean {
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < position; i++) {
    const char = str[i];
    if (char === "'" && !inDouble) inSingle = !inSingle;
    if (char === '"' && !inSingle) inDouble = !inDouble;
  }

  return inSingle || inDouble;
}
