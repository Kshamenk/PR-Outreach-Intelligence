import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { pool } from "../../../config/db";
import { cleanDatabase } from "../../../__tests__/helpers";
import * as authService from "../auth.service";
import fs from "fs";
import path from "path";

// Run schema migration before all tests in this file
beforeAll(async () => {
  const schemaPath = path.resolve(__dirname, "../../../config/schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");
  await pool.query(schema);
});

afterAll(async () => {
  await pool.end();
});

describe("AuthService (integration)", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  const userAgent = "test-agent";
  const ipAddress = "127.0.0.1";

  describe("register", () => {
    it("should create a new user and return tokens", async () => {
      const result = await authService.register(
        { email: "new@test.com", password: "securepass123" },
        userAgent,
        ipAddress
      );

      expect(result.user.email).toBe("new@test.com");
      expect(result.user.id).toBeGreaterThan(0);
      expect(result.accessToken).toBeDefined();
      expect(result.accessToken.split(".")).toHaveLength(3); // JWT format
      expect(result.refreshToken).toBeDefined();
      expect(result.refreshToken.length).toBe(80); // 40 bytes hex
    });

    it("should throw for duplicate email", async () => {
      await authService.register(
        { email: "dup@test.com", password: "securepass123" },
        userAgent,
        ipAddress
      );

      await expect(
        authService.register(
          { email: "dup@test.com", password: "otherpass123" },
          userAgent,
          ipAddress
        )
      ).rejects.toThrow("Email already registered");
    });
  });

  describe("login", () => {
    it("should return tokens for valid credentials", async () => {
      await authService.register(
        { email: "login@test.com", password: "securepass123" },
        userAgent,
        ipAddress
      );

      const result = await authService.login(
        { email: "login@test.com", password: "securepass123" },
        userAgent,
        ipAddress
      );

      expect(result.user.email).toBe("login@test.com");
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it("should throw for wrong password", async () => {
      await authService.register(
        { email: "login@test.com", password: "securepass123" },
        userAgent,
        ipAddress
      );

      await expect(
        authService.login(
          { email: "login@test.com", password: "wrongpassword" },
          userAgent,
          ipAddress
        )
      ).rejects.toThrow("Invalid email or password");
    });

    it("should throw for non-existent email", async () => {
      await expect(
        authService.login(
          { email: "nonexistent@test.com", password: "securepass123" },
          userAgent,
          ipAddress
        )
      ).rejects.toThrow("Invalid email or password");
    });
  });

  describe("refresh", () => {
    it("should rotate the refresh token", async () => {
      const registered = await authService.register(
        { email: "refresh@test.com", password: "securepass123" },
        userAgent,
        ipAddress
      );

      const refreshed = await authService.refresh(
        registered.refreshToken,
        userAgent,
        ipAddress
      );

      expect(refreshed.user.email).toBe("refresh@test.com");
      expect(refreshed.accessToken).toBeDefined();
      expect(refreshed.refreshToken).toBeDefined();
      // New token should differ from original
      expect(refreshed.refreshToken).not.toBe(registered.refreshToken);
    });

    it("should reject the old refresh token after rotation", async () => {
      const registered = await authService.register(
        { email: "revoke@test.com", password: "securepass123" },
        userAgent,
        ipAddress
      );

      // First refresh should succeed
      await authService.refresh(registered.refreshToken, userAgent, ipAddress);

      // Second use of old token should fail (revoked)
      await expect(
        authService.refresh(registered.refreshToken, userAgent, ipAddress)
      ).rejects.toThrow("Invalid refresh token");
    });

    it("should throw for invalid token", async () => {
      await expect(
        authService.refresh("invalid-token", userAgent, ipAddress)
      ).rejects.toThrow("Invalid refresh token");
    });
  });

  describe("logout", () => {
    it("should revoke the session", async () => {
      const registered = await authService.register(
        { email: "logout@test.com", password: "securepass123" },
        userAgent,
        ipAddress
      );

      await authService.logout(registered.refreshToken);

      // Token should no longer work
      await expect(
        authService.refresh(registered.refreshToken, userAgent, ipAddress)
      ).rejects.toThrow("Invalid refresh token");
    });

    it("should not throw for already-revoked token", async () => {
      await expect(authService.logout("nonexistent-token")).resolves.not.toThrow();
    });
  });

  describe("logoutAll", () => {
    it("should revoke all sessions for a user", async () => {
      const registered = await authService.register(
        { email: "logoutall@test.com", password: "securepass123" },
        userAgent,
        ipAddress
      );

      // Create a second session via login
      const loggedIn = await authService.login(
        { email: "logoutall@test.com", password: "securepass123" },
        userAgent,
        ipAddress
      );

      await authService.logoutAll(registered.user.id);

      // Both tokens should be revoked
      await expect(
        authService.refresh(registered.refreshToken, userAgent, ipAddress)
      ).rejects.toThrow("Invalid refresh token");
      await expect(
        authService.refresh(loggedIn.refreshToken, userAgent, ipAddress)
      ).rejects.toThrow("Invalid refresh token");
    });
  });

  describe("me", () => {
    it("should return user profile", async () => {
      const registered = await authService.register(
        { email: "me@test.com", password: "securepass123" },
        userAgent,
        ipAddress
      );

      const profile = await authService.me(registered.user.id);

      expect(profile.id).toBe(registered.user.id);
      expect(profile.email).toBe("me@test.com");
      expect(profile.createdAt).toBeDefined();
    });

    it("should throw for non-existent user", async () => {
      await expect(authService.me(99999)).rejects.toThrow("User not found");
    });
  });
});
