import fs from "fs";

export class Allowlist {
  private ids = new Set<string>();

  constructor(initial?: string[]) {
    if (initial) {
      initial.forEach((id) => this.ids.add(id));
    }
  }

  add(id: string): void {
    this.ids.add(id);
  }

  has(id: string): boolean {
    return this.ids.has(id);
  }

  toJSON(): string[] {
    return Array.from(this.ids.values());
  }

  static fromFile(filePath: string): Allowlist {
    if (!fs.existsSync(filePath)) {
      return new Allowlist();
    }

    const raw = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(raw) as string[];
    return new Allowlist(data);
  }
}
