import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import request from "supertest";
import fs from "fs";
import path from "path";
import { pool } from "../../../config/db";
import { app, cleanDatabase, createTestUser, authToken } from "../../../__tests__/helpers";

let token: string;

beforeAll(async () => {
  const schema = fs.readFileSync(path.resolve(__dirname, "../../../config/schema.sql"), "utf-8");
  await pool.query(schema);
});
afterAll(() => pool.end());

beforeEach(async () => {
  await cleanDatabase();
  const user = await createTestUser();
  token = authToken(user.id);
});

describe("Dashboard API", () => {
  describe("GET /api/dashboard/stats", () => {
    it("should return stats (200)", async () => {
      const res = await request(app)
        .get("/api/dashboard/stats")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("totalContacts");
      expect(res.body).toHaveProperty("activeCampaigns");
      expect(res.body).toHaveProperty("emailsSent");
      expect(res.body).toHaveProperty("repliesReceived");
      expect(res.body).toHaveProperty("responseRate");
      expect(res.body).toHaveProperty("draftsPendingReview");
    });

    it("should return zero stats for new user", async () => {
      const res = await request(app)
        .get("/api/dashboard/stats")
        .set("Authorization", `Bearer ${token}`);
      expect(res.body.totalContacts).toBe(0);
      expect(res.body.activeCampaigns).toBe(0);
      expect(res.body.responseRate).toBe(0);
    });

    it("should reflect created contacts", async () => {
      await request(app).post("/api/contacts").set("Authorization", `Bearer ${token}`)
        .send({ name: "A", email: "a@t.com" });
      await request(app).post("/api/contacts").set("Authorization", `Bearer ${token}`)
        .send({ name: "B", email: "b@t.com" });

      const res = await request(app)
        .get("/api/dashboard/stats")
        .set("Authorization", `Bearer ${token}`);
      expect(res.body.totalContacts).toBe(2);
    });

    it("should reject unauthenticated (401)", async () => {
      const res = await request(app).get("/api/dashboard/stats");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/dashboard/activity", () => {
    it("should return recent activity (200)", async () => {
      await request(app).post("/api/contacts").set("Authorization", `Bearer ${token}`)
        .send({ name: "Activity Test", email: "act@t.com" });

      const res = await request(app)
        .get("/api/dashboard/activity")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty("type");
      expect(res.body[0]).toHaveProperty("title");
    });

    it("should return empty for new user with no activity", async () => {
      const res = await request(app)
        .get("/api/dashboard/activity")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });
});
