import { ToolRegistry } from "../tools";
import { runBashTool } from "../tools/bash";
import { runFilesTool } from "../tools/files";
import { runHttpTool } from "../tools/http";

export function createDefaultToolRegistry(): ToolRegistry {
  const registry = new ToolRegistry();

  registry.register({
    name: "bash",
    description: "Run a shell command",
    run: runBashTool
  });

  registry.register({
    name: "files",
    description: "Read or write local files",
    run: runFilesTool
  });

  registry.register({
    name: "http",
    description: "Make HTTP requests",
    run: runHttpTool
  });

  return registry;
}

export { ToolRegistry } from "../tools";
