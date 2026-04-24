import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from "vitest";
import request from "supertest";
import fs from "fs";
import path from "path";
import { pool } from "../../../config/db";
import { app, cleanDatabase, createTestUser, authToken } from "../../../__tests__/helpers";

// Mock the AI provider to avoid real API calls
vi.mock("../ai.provider", () => ({
  generateCompletion: vi.fn().mockResolvedValue({
    subject: "Exciting news about our AI product",
    body: "Dear Sarah, I wanted to share some exciting developments...",
  }),
  getActiveModel: vi.fn().mockReturnValue("gpt-4o-mini-mock"),
}));

let token: string;
let contactId: number;
let campaignId: number;

beforeAll(async () => {
  const schema = fs.readFileSync(path.resolve(__dirname, "../../../config/schema.sql"), "utf-8");
  await pool.query(schema);
});
afterAll(() => pool.end());

beforeEach(async () => {
  await cleanDatabase();
  vi.clearAllMocks();
  const user = await createTestUser();
  token = authToken(user.id);

  const contact = await request(app)
    .post("/api/contacts")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Sarah", email: "sarah@tech.com", outlet: "TechCrunch", topics: ["AI"] });
  contactId = contact.body.id;

  const campaign = await request(app)
    .post("/api/campaigns")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "AI Launch", description: "Launch", objective: "Coverage" });
  campaignId = campaign.body.id;
});

describe("AI API", () => {
  describe("POST /api/ai/generate", () => {
    it("should generate outreach (201)", async () => {
      const res = await request(app)
        .post("/api/ai/generate")
        .set("Authorization", `Bearer ${token}`)
        .send({ contactId, campaignId });
      expect(res.status).toBe(201);
      expect(res.body.suggestionId).toBeGreaterThan(0);
      expect(res.body.subject).toBeDefined();
      expect(res.body.body).toBeDefined();
      expect(res.body.model).toBe("gpt-4o-mini-mock");
    });

    it("should apply custom tone and length", async () => {
      const res = await request(app)
        .post("/api/ai/generate")
        .set("Authorization", `Bearer ${token}`)
        .send({ contactId, campaignId, tone: "warm", length: "short" });
      expect(res.status).toBe(201);
    });

    it("should reject missing fields (400)", async () => {
      const res = await request(app)
        .post("/api/ai/generate")
        .set("Authorization", `Bearer ${token}`)
        .send({ contactId });
      expect(res.status).toBe(400);
    });

    it("should reject unauthenticated (401)", async () => {
      const res = await request(app)
        .post("/api/ai/generate")
        .send({ contactId, campaignId });
      expect(res.status).toBe(401);
    });

    it("should reject non-existent contact (404)", async () => {
      const res = await request(app)
        .post("/api/ai/generate")
        .set("Authorization", `Bearer ${token}`)
        .send({ contactId: 99999, campaignId });
      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/ai/suggestions", () => {
    it("should list suggestions (200)", async () => {
      await request(app).post("/api/ai/generate").set("Authorization", `Bearer ${token}`)
        .send({ contactId, campaignId });
      await request(app).post("/api/ai/generate").set("Authorization", `Bearer ${token}`)
        .send({ contactId, campaignId });

      const res = await request(app)
        .get("/api/ai/suggestions")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(2);
      expect(res.body.data).toHaveLength(2);
    });
  });

  describe("GET /api/ai/suggestions/:id", () => {
    it("should return a suggestion (200)", async () => {
      const gen = await request(app).post("/api/ai/generate").set("Authorization", `Bearer ${token}`)
        .send({ contactId, campaignId });

      const res = await request(app)
        .get(`/api/ai/suggestions/${gen.body.suggestionId}`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(gen.body.suggestionId);
    });

    it("should return 404 for non-existent", async () => {
      const res = await request(app)
        .get("/api/ai/suggestions/99999")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/ai/suggestions/:id/accept", () => {
    it("should accept a suggestion (200)", async () => {
      const gen = await request(app).post("/api/ai/generate").set("Authorization", `Bearer ${token}`)
        .send({ contactId, campaignId });

      const res = await request(app)
        .patch(`/api/ai/suggestions/${gen.body.suggestionId}/accept`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("accepted");
    });

    it("should reject already-processed suggestion", async () => {
      const gen = await request(app).post("/api/ai/generate").set("Authorization", `Bearer ${token}`)
        .send({ contactId, campaignId });
      await request(app)
        .patch(`/api/ai/suggestions/${gen.body.suggestionId}/accept`)
        .set("Authorization", `Bearer ${token}`);

      const res = await request(app)
        .patch(`/api/ai/suggestions/${gen.body.suggestionId}/accept`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/ai/suggestions/:id/reject", () => {
    it("should reject a suggestion with reason (200)", async () => {
      const gen = await request(app).post("/api/ai/generate").set("Authorization", `Bearer ${token}`)
        .send({ contactId, campaignId });

      const res = await request(app)
        .patch(`/api/ai/suggestions/${gen.body.suggestionId}/reject`)
        .set("Authorization", `Bearer ${token}`)
        .send({ reason: "Too generic" });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("rejected");
    });

    it("should reject without reason (200)", async () => {
      const gen = await request(app).post("/api/ai/generate").set("Authorization", `Bearer ${token}`)
        .send({ contactId, campaignId });

      const res = await request(app)
        .patch(`/api/ai/suggestions/${gen.body.suggestionId}/reject`)
        .set("Authorization", `Bearer ${token}`)
        .send({});
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("rejected");
    });
  });
});
