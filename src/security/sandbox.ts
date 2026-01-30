const DENYLIST = ["rm ", "sudo", "shutdown", "reboot", "mkfs", ":(){:|:&};:"];

export function isCommandAllowed(command: string): boolean {
  const lowered = command.toLowerCase();
  return !DENYLIST.some((token) => lowered.includes(token));
}
