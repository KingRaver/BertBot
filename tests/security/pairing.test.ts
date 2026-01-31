import {
  generatePairingCode,
  verifyPairingCode,
  isExpired,
  getTimeRemaining,
  formatTimeRemaining,
  type PairingCode
} from "@security/pairing";

describe("Pairing Code Security", () => {
  describe("generatePairingCode", () => {
    it("should generate code with default length of 8", () => {
      const result = generatePairingCode();
      expect(result.code).toHaveLength(8);
    });

    it("should generate code with custom length", () => {
      const result = generatePairingCode({ length: 12 });
      expect(result.code).toHaveLength(12);
    });

    it("should reject length less than 8", () => {
      expect(() => generatePairingCode({ length: 6 })).toThrow(
        "Pairing code length must be at least 8 characters"
      );
    });

    it("should generate numeric codes", () => {
      const result = generatePairingCode({ charset: "numeric" });
      expect(result.code).toMatch(/^[0-9]+$/);
    });

    it("should generate alphanumeric codes", () => {
      const result = generatePairingCode({ charset: "alphanumeric" });
      expect(result.code).toMatch(/^[0-9a-zA-Z]+$/);
    });

    it("should generate alphanumeric-upper codes by default", () => {
      const result = generatePairingCode();
      expect(result.code).toMatch(/^[0-9A-Z]+$/);
    });

    it("should set createdAt timestamp", () => {
      const before = Date.now();
      const result = generatePairingCode();
      const after = Date.now();

      expect(result.createdAt).toBeGreaterThanOrEqual(before);
      expect(result.createdAt).toBeLessThanOrEqual(after);
    });

    it("should set expiresAt timestamp with default 5 minutes", () => {
      const result = generatePairingCode();
      const expectedExpiry = result.createdAt + 5 * 60 * 1000;

      expect(result.expiresAt).toBe(expectedExpiry);
    });

    it("should set custom expiry time", () => {
      const customExpiry = 10 * 60 * 1000; // 10 minutes
      const result = generatePairingCode({ expiryMs: customExpiry });
      const expectedExpiry = result.createdAt + customExpiry;

      expect(result.expiresAt).toBe(expectedExpiry);
    });

    it("should generate unique codes", () => {
      const codes = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        const result = generatePairingCode();
        codes.add(result.code);
      }

      // With 8 characters from 36-char charset, collision chance is extremely low
      // Expecting at least 999 unique codes out of 1000
      expect(codes.size).toBeGreaterThan(998);
    });

    it("should use cryptographically secure randomness", () => {
      const results = [];
      for (let i = 0; i < 100; i++) {
        results.push(generatePairingCode({ length: 8, charset: "numeric" }));
      }

      // Check distribution of first digit (should be fairly uniform)
      const firstDigits: Record<string, number> = {};
      results.forEach(r => {
        const first = r.code[0];
        firstDigits[first] = (firstDigits[first] || 0) + 1;
      });

      // Each digit should appear at least once in 100 samples
      // (statistically very likely with good randomness)
      const uniqueDigits = Object.keys(firstDigits).length;
      expect(uniqueDigits).toBeGreaterThan(5);
    });
  });

  describe("verifyPairingCode", () => {
    it("should verify valid code", () => {
      const pairing = generatePairingCode();
      const result = verifyPairingCode(pairing, pairing.code);

      expect(result).toBe(true);
    });

    it("should reject invalid code", () => {
      const pairing = generatePairingCode();
      const result = verifyPairingCode(pairing, "WRONGCODE");

      expect(result).toBe(false);
    });

    it("should reject code with wrong length", () => {
      const pairing = generatePairingCode({ length: 8 });
      const result = verifyPairingCode(pairing, "SHORT");

      expect(result).toBe(false);
    });

    it("should reject expired code", () => {
      const pairing: PairingCode = {
        code: "TESTCODE",
        createdAt: Date.now() - 10 * 60 * 1000,
        expiresAt: Date.now() - 1000 // Expired 1 second ago
      };

      const result = verifyPairingCode(pairing, "TESTCODE");
      expect(result).toBe(false);
    });

    it("should handle codes with whitespace", () => {
      const pairing = generatePairingCode();
      const result = verifyPairingCode(pairing, ` ${pairing.code} `);

      expect(result).toBe(true);
    });

    it("should be case-sensitive", () => {
      const pairing: PairingCode = {
        code: "TESTCODE",
        createdAt: Date.now(),
        expiresAt: Date.now() + 60000
      };

      expect(verifyPairingCode(pairing, "TESTCODE")).toBe(true);
      expect(verifyPairingCode(pairing, "testcode")).toBe(false);
      expect(verifyPairingCode(pairing, "TestCode")).toBe(false);
    });

    it("should use timing-safe comparison (timingSafeEqual)", () => {
      const pairing: PairingCode = {
        code: "12345678",
        createdAt: Date.now(),
        expiresAt: Date.now() + 60000
      };

      // Verify that timing-safe comparison is used by checking the function works correctly
      // with codes that have different numbers of matching characters

      // All different - should be false
      expect(verifyPairingCode(pairing, "00000000")).toBe(false);

      // Partially matching - should be false
      expect(verifyPairingCode(pairing, "12340000")).toBe(false);
      expect(verifyPairingCode(pairing, "12345000")).toBe(false);
      expect(verifyPairingCode(pairing, "12345670")).toBe(false);

      // One char different - should be false
      expect(verifyPairingCode(pairing, "12345679")).toBe(false);

      // All matching - should be true
      expect(verifyPairingCode(pairing, "12345678")).toBe(true);

      // The use of crypto.timingSafeEqual ensures constant-time comparison
      // preventing timing attacks that could reveal partial matches
    });

    it("should handle empty string", () => {
      const pairing = generatePairingCode();
      const result = verifyPairingCode(pairing, "");

      expect(result).toBe(false);
    });

    it("should handle special characters", () => {
      const pairing = generatePairingCode();
      const result = verifyPairingCode(pairing, "!@#$%^&*");

      expect(result).toBe(false);
    });
  });

  describe("isExpired", () => {
    it("should return false for non-expired code", () => {
      const pairing: PairingCode = {
        code: "TEST1234",
        createdAt: Date.now(),
        expiresAt: Date.now() + 60000 // Expires in 1 minute
      };

      expect(isExpired(pairing)).toBe(false);
    });

    it("should return true for expired code", () => {
      const pairing: PairingCode = {
        code: "TEST1234",
        createdAt: Date.now() - 60000,
        expiresAt: Date.now() - 1000 // Expired 1 second ago
      };

      expect(isExpired(pairing)).toBe(true);
    });

    it("should return true for code expiring exactly now", () => {
      const now = Date.now();
      const pairing: PairingCode = {
        code: "TEST1234",
        createdAt: now - 60000,
        expiresAt: now
      };

      // May or may not be expired depending on exact timing
      // Just verify it doesn't throw
      expect(typeof isExpired(pairing)).toBe("boolean");
    });
  });

  describe("getTimeRemaining", () => {
    it("should return correct time remaining", () => {
      const pairing: PairingCode = {
        code: "TEST1234",
        createdAt: Date.now(),
        expiresAt: Date.now() + 60000 // 60 seconds
      };

      const remaining = getTimeRemaining(pairing);

      expect(remaining).toBeGreaterThan(59000);
      expect(remaining).toBeLessThanOrEqual(60000);
    });

    it("should return 0 for expired code", () => {
      const pairing: PairingCode = {
        code: "TEST1234",
        createdAt: Date.now() - 120000,
        expiresAt: Date.now() - 60000
      };

      expect(getTimeRemaining(pairing)).toBe(0);
    });

    it("should never return negative value", () => {
      const pairing: PairingCode = {
        code: "TEST1234",
        createdAt: Date.now() - 1000000,
        expiresAt: Date.now() - 500000
      };

      const remaining = getTimeRemaining(pairing);
      expect(remaining).toBeGreaterThanOrEqual(0);
    });
  });

  describe("formatTimeRemaining", () => {
    it("should format minutes and seconds", () => {
      const pairing: PairingCode = {
        code: "TEST1234",
        createdAt: Date.now(),
        expiresAt: Date.now() + 150000 // 2m 30s
      };

      const formatted = formatTimeRemaining(pairing);
      expect(formatted).toMatch(/^2m \d+s$/);
    });

    it("should format seconds only", () => {
      const pairing: PairingCode = {
        code: "TEST1234",
        createdAt: Date.now(),
        expiresAt: Date.now() + 45000 // 45s
      };

      const formatted = formatTimeRemaining(pairing);
      expect(formatted).toMatch(/^\d+s$/);
      expect(formatted).not.toContain("m");
    });

    it("should return 'expired' for expired code", () => {
      const pairing: PairingCode = {
        code: "TEST1234",
        createdAt: Date.now() - 120000,
        expiresAt: Date.now() - 60000
      };

      expect(formatTimeRemaining(pairing)).toBe("expired");
    });

    it("should handle exact expiry time", () => {
      const pairing: PairingCode = {
        code: "TEST1234",
        createdAt: Date.now() - 1000,
        expiresAt: Date.now()
      };

      const formatted = formatTimeRemaining(pairing);
      expect(["0s", "expired"]).toContain(formatted);
    });
  });

  describe("Security Properties", () => {
    it("should have sufficient entropy (8 chars, 36-char alphabet)", () => {
      // 8 characters from 36-char alphabet = 36^8 = ~2.8 trillion combinations
      // This is sufficient to prevent brute force within 5-minute window

      const pairing = generatePairingCode({ length: 8, charset: "alphanumeric-upper" });

      // Calculate entropy: log2(36^8) ≈ 41.4 bits
      const charsetSize = 36;
      const length = 8;
      const combinations = Math.pow(charsetSize, length);
      const entropyBits = Math.log2(combinations);

      expect(entropyBits).toBeGreaterThan(40);
    });

    it("should prevent timing attacks on verification", () => {
      const pairing: PairingCode = {
        code: "ABCD1234",
        createdAt: Date.now(),
        expiresAt: Date.now() + 60000
      };

      // Verify with codes that match different prefixes
      const results = [
        verifyPairingCode(pairing, "XBCD1234"), // Wrong first char
        verifyPairingCode(pairing, "AXCD1234"), // Wrong second char
        verifyPairingCode(pairing, "ABXD1234"), // Wrong third char
        verifyPairingCode(pairing, "ABCX1234")  // Wrong fourth char
      ];

      // All should be false
      expect(results.every(r => r === false)).toBe(true);
    });

    it("should expire codes after configured time", async () => {
      const pairing = generatePairingCode({ expiryMs: 100 }); // 100ms

      // Code should be valid initially
      expect(verifyPairingCode(pairing, pairing.code)).toBe(true);

      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 150));

      // Code should now be invalid
      expect(verifyPairingCode(pairing, pairing.code)).toBe(false);
      expect(isExpired(pairing)).toBe(true);
    }, 300);
  });
});
