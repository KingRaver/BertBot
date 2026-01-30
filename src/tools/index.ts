export type ToolHandler = (input: string) => Promise<string>;

export interface Tool {
  name: string;
  description: string;
  run: ToolHandler;
}

export class ToolRegistry {
  private tools = new Map<string, Tool>();

  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  list(): Tool[] {
    return Array.from(this.tools.values());
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  async run(name: string, input: string): Promise<string> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }
    return tool.run(input);
  }
}
