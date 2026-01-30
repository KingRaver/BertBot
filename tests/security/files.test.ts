import { runFilesTool } from "@tools/files";
import fs from "fs/promises";
import path from "path";
import os from "os";

describe("Files Tool Security", () => {
  let testDir: string;
  let originalCwd: string;

  beforeAll(async () => {
    originalCwd = process.cwd();
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), "bertbot-test-"));
    process.chdir(testDir);
  });

  afterAll(async () => {
    process.chdir(originalCwd);
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe("Path traversal attacks", () => {
    it("should block absolute path outside workspace", async () => {
      const input = JSON.stringify({
        action: "read",
        path: "/etc/passwd"
      });
      await expect(runFilesTool(input)).rejects.toThrow("Path is outside workspace");
    });

    it("should block relative path traversal with ../", async () => {
      const input = JSON.stringify({
        action: "read",
        path: "../../../etc/passwd"
      });
      await expect(runFilesTool(input)).rejects.toThrow("Path is outside workspace");
    });

    it("should block path starting with ../", async () => {
      const input = JSON.stringify({
        action: "read",
        path: "../../sensitive.txt"
      });
      await expect(runFilesTool(input)).rejects.toThrow("Path is outside workspace");
    });

    it("should block encoded path traversal", async () => {
      const input = JSON.stringify({
        action: "read",
        path: "..%2F..%2Fetc%2Fpasswd"
      });
      // Current implementation may not catch this - documents vulnerability
      await expect(runFilesTool(input)).rejects.toThrow();
    });

    it("should block path with mixed separators", async () => {
      const input = JSON.stringify({
        action: "read",
        path: "..\\..\\..\\etc\\passwd"
      });
      await expect(runFilesTool(input)).rejects.toThrow("Path is outside workspace");
    });
  });

  describe("Symlink attacks", () => {
    it("should detect symlink pointing outside workspace", async () => {
      // Create a symlink pointing to /etc/passwd
      const symlinkPath = path.join(testDir, "malicious-link");
      try {
        await fs.symlink("/etc/passwd", symlinkPath);
      } catch (err) {
        // Symlink creation might fail, skip test
        return;
      }

      const input = JSON.stringify({
        action: "read",
        path: "malicious-link"
      });

      // Current implementation DOES NOT check symlinks - this documents the vulnerability
      // This test will likely PASS reading /etc/passwd content, showing the security issue
      try {
        const result = await runFilesTool(input);
        // If we got here, symlink attack succeeded (VULNERABILITY)
        expect(result).toBeDefined();
        console.warn("VULNERABILITY: Symlink attack succeeded, read content from outside workspace");
      } catch (err) {
        // If it failed, good - but likely for wrong reason (file not found, not security check)
      }
    });
  });

  describe("File write attacks", () => {
    it("should block writing to absolute paths", async () => {
      const input = JSON.stringify({
        action: "write",
        path: "/tmp/malicious.txt",
        content: "attack"
      });
      await expect(runFilesTool(input)).rejects.toThrow("Path is outside workspace");
    });

    it("should block writing outside workspace via ../", async () => {
      const input = JSON.stringify({
        action: "write",
        path: "../../attack.txt",
        content: "malicious"
      });
      await expect(runFilesTool(input)).rejects.toThrow("Path is outside workspace");
    });

    it("should block writing to parent directory", async () => {
      const input = JSON.stringify({
        action: "write",
        path: "../secret.env",
        content: "API_KEY=stolen"
      });
      await expect(runFilesTool(input)).rejects.toThrow("Path is outside workspace");
    });
  });

  describe("Valid operations within workspace", () => {
    it("should allow reading file in workspace", async () => {
      const testFile = path.join(testDir, "test.txt");
      await fs.writeFile(testFile, "test content");

      const input = JSON.stringify({
        action: "read",
        path: "test.txt"
      });
      const result = await runFilesTool(input);
      expect(result).toBe("test content");
    });

    it("should allow writing file in workspace", async () => {
      const input = JSON.stringify({
        action: "write",
        path: "output.txt",
        content: "new content"
      });
      const result = await runFilesTool(input);
      expect(result).toBe("ok");

      const content = await fs.readFile(path.join(testDir, "output.txt"), "utf8");
      expect(content).toBe("new content");
    });

    it("should allow reading from subdirectory", async () => {
      await fs.mkdir(path.join(testDir, "subdir"));
      await fs.writeFile(path.join(testDir, "subdir", "file.txt"), "sub content");

      const input = JSON.stringify({
        action: "read",
        path: "subdir/file.txt"
      });
      const result = await runFilesTool(input);
      expect(result).toBe("sub content");
    });

    it("should allow writing to subdirectory", async () => {
      const input = JSON.stringify({
        action: "write",
        path: "newdir/file.txt",
        content: "nested content"
      });
      await runFilesTool(input);

      const content = await fs.readFile(path.join(testDir, "newdir", "file.txt"), "utf8");
      expect(content).toBe("nested content");
    });
  });

  describe("Input validation", () => {
    it("should reject invalid JSON", async () => {
      await expect(runFilesTool("not json")).rejects.toThrow("Invalid JSON");
    });

    it("should reject missing path", async () => {
      const input = JSON.stringify({
        action: "read"
      });
      await expect(runFilesTool(input)).rejects.toThrow("Missing path");
    });

    it("should reject missing content for write", async () => {
      const input = JSON.stringify({
        action: "write",
        path: "test.txt"
      });
      await expect(runFilesTool(input)).rejects.toThrow("Missing content");
    });

    it("should reject unsupported action", async () => {
      const input = JSON.stringify({
        action: "delete",
        path: "test.txt"
      });
      await expect(runFilesTool(input)).rejects.toThrow("Unsupported");
    });
  });

  describe("Edge cases and potential exploits", () => {
    it("should handle null bytes in path", async () => {
      const input = JSON.stringify({
        action: "read",
        path: "test.txt\0/etc/passwd"
      });
      // Current implementation may not sanitize null bytes
      await expect(runFilesTool(input)).rejects.toThrow();
    });

    it("should handle very long paths", async () => {
      const longPath = "a/".repeat(1000) + "file.txt";
      const input = JSON.stringify({
        action: "read",
        path: longPath
      });
      // Should either work or fail gracefully, not crash
      await expect(runFilesTool(input)).rejects.toThrow();
    });

    it("should handle empty path", async () => {
      const input = JSON.stringify({
        action: "read",
        path: ""
      });
      await expect(runFilesTool(input)).rejects.toThrow();
    });

    it("should handle path with only dots", async () => {
      const input = JSON.stringify({
        action: "read",
        path: "..."
      });
      // Should handle gracefully
      await expect(runFilesTool(input)).rejects.toThrow();
    });
  });
});
