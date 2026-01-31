import { ToolRegistry } from "../tools";
import { runBashTool } from "../tools/bash";
import { runFilesTool } from "../tools/files";
import { runHttpTool } from "../tools/http";
import type { AppConfig } from "../types/config";
import { createNotionTool } from "../tools/notion";

export function createDefaultToolRegistry(config?: AppConfig): ToolRegistry {
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

  if (config?.notion?.enabled) {
    registry.register({
      name: "notion",
      description: "Interact with Notion (search, create, update, append blocks)",
      run: createNotionTool(config.notion)
    });
  }

  return registry;
}

export { ToolRegistry } from "../tools";
