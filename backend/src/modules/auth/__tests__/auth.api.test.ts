import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import request from "supertest";
import fs from "fs";
import path from "path";
import { pool } from "../../../config/db";
import { app, cleanDatabase } from "../../../__tests__/helpers";

beforeAll(async () => {
  const schema = fs.readFileSync(path.resolve(__dirname, "../../../config/schema.sql"), "utf-8");
  await pool.query(schema);
});
afterAll(() => pool.end());
beforeEach(() => cleanDatabase());

describe("Auth API", () => {
  const validUser = { email: "test@api.com", password: "securepassword123" };

  describe("POST /api/auth/register", () => {
    it("should register a new user and return tokens (201)", async () => {
      const res = await request(app).post("/api/auth/register").send(validUser);
      expect(res.status).toBe(201);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.email).toBe(validUser.email);
    });

    it("should reject duplicate email (409)", async () => {
      await request(app).post("/api/auth/register").send(validUser);
      const res = await request(app).post("/api/auth/register").send(validUser);
      expect(res.status).toBe(409);
      expect(res.body.error).toContain("already registered");
    });

    it("should reject invalid body (400)", async () => {
      const res = await request(app).post("/api/auth/register").send({ email: "bad" });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      await request(app).post("/api/auth/register").send(validUser);
    });

    it("should login with valid credentials (200)", async () => {
      const res = await request(app).post("/api/auth/login").send(validUser);
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
    });

    it("should reject wrong password (401)", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: validUser.email, password: "wrongpassword1" });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Invalid email or password");
    });

    it("should reject non-existent email (401)", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "nobody@test.com", password: "whatever1234" });
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/auth/refresh", () => {
    it("should refresh tokens (200)", async () => {
      const reg = await request(app).post("/api/auth/register").send(validUser);
      const res = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: reg.body.refreshToken });
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      // Old token should be different from new
      expect(res.body.refreshToken).not.toBe(reg.body.refreshToken);
    });

    it("should reject an already-used refresh token (401)", async () => {
      const reg = await request(app).post("/api/auth/register").send(validUser);
      const oldToken = reg.body.refreshToken;
      await request(app).post("/api/auth/refresh").send({ refreshToken: oldToken });
      const res = await request(app).post("/api/auth/refresh").send({ refreshToken: oldToken });
      expect(res.status).toBe(401);
    });

    it("should reject invalid refresh token (401)", async () => {
      const res = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: "totally-invalid-token" });
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should logout and return 204", async () => {
      const reg = await request(app).post("/api/auth/register").send(validUser);
      const res = await request(app)
        .post("/api/auth/logout")
        .send({ refreshToken: reg.body.refreshToken });
      expect(res.status).toBe(204);
    });

    it("should return 204 even without refresh token (graceful)", async () => {
      const res = await request(app).post("/api/auth/logout").send({});
      expect(res.status).toBe(204);
    });
  });

  describe("POST /api/auth/logout-all", () => {
    it("should require authentication (401)", async () => {
      const res = await request(app).post("/api/auth/logout-all");
      expect(res.status).toBe(401);
    });

    it("should revoke all sessions (204)", async () => {
      const reg = await request(app).post("/api/auth/register").send(validUser);
      const res = await request(app)
        .post("/api/auth/logout-all")
        .set("Authorization", `Bearer ${reg.body.accessToken}`);
      expect(res.status).toBe(204);

      // Refresh token should no longer work
      const refresh = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: reg.body.refreshToken });
      expect(refresh.status).toBe(401);
    });
  });

  describe("GET /api/auth/me", () => {
    it("should return user profile (200)", async () => {
      const reg = await request(app).post("/api/auth/register").send(validUser);
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${reg.body.accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.email).toBe(validUser.email);
    });

    it("should reject missing token (401)", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
    });

    it("should reject expired/invalid token (401)", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid.jwt.token");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /health", () => {
    it("should return ok", async () => {
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
    });
  });
});
