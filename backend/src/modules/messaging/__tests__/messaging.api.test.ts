import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from "vitest";
import request from "supertest";
import fs from "fs";
import path from "path";
import { pool } from "../../../config/db";
import { app, cleanDatabase, createTestUser, authToken } from "../../../__tests__/helpers";

// Mock email provider
vi.mock("../providers", () => ({
  sendEmail: vi.fn().mockResolvedValue({ providerMessageId: "mock_msg_001" }),
}));

// Mock AI provider for generating suggestions
vi.mock("../../ai/ai.provider", () => ({
  generateCompletion: vi.fn().mockResolvedValue({
    subject: "Test Subject",
    body: "Test body content",
  }),
  getActiveModel: vi.fn().mockReturnValue("mock-model"),
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
    .send({ name: "Reporter", email: "reporter@news.com", outlet: "BBC", topics: ["tech"] });
  contactId = contact.body.id;

  const campaign = await request(app)
    .post("/api/campaigns")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Launch", description: "desc", objective: "coverage" });
  campaignId = campaign.body.id;

  await request(app)
    .post(`/api/campaigns/${campaignId}/contacts`)
    .set("Authorization", `Bearer ${token}`)
    .send({ contactIds: [contactId] });
});

describe("Messaging API", () => {
  describe("POST /api/messaging/send", () => {
    it("should send an email (201)", async () => {
      const res = await request(app)
        .post("/api/messaging/send")
        .set("Authorization", `Bearer ${token}`)
        .send({
          contactId,
          campaignId,
          subject: "Press Release",
          body: "Dear reporter, exciting news...",
        });
      expect(res.status).toBe(201);
      expect(res.body.interactionId).toBeGreaterThan(0);
      expect(res.body.providerMessageId).toBe("mock_msg_001");
      expect(res.body.status).toBe("sent");
    });

    it("should reject missing subject (400)", async () => {
      const res = await request(app)
        .post("/api/messaging/send")
        .set("Authorization", `Bearer ${token}`)
        .send({ contactId, body: "test" });
      expect(res.status).toBe(400);
    });

    it("should reject unauthenticated (401)", async () => {
      const res = await request(app)
        .post("/api/messaging/send")
        .send({ contactId, subject: "Hi", body: "test" });
      expect(res.status).toBe(401);
    });

    it("should reject non-existent contact (404)", async () => {
      const res = await request(app)
        .post("/api/messaging/send")
        .set("Authorization", `Bearer ${token}`)
        .send({ contactId: 99999, subject: "Hi", body: "test" });
      expect(res.status).toBe(404);
    });

    it("should reject archived contact (400)", async () => {
      await request(app)
        .delete(`/api/contacts/${contactId}`)
        .set("Authorization", `Bearer ${token}`);

      const res = await request(app)
        .post("/api/messaging/send")
        .set("Authorization", `Bearer ${token}`)
        .send({ contactId, subject: "Hi", body: "test" });
      expect(res.status).toBe(400);
    });

    it("should send with AI suggestion and mark it as sent", async () => {
      // Generate + accept suggestion
      const gen = await request(app)
        .post("/api/ai/generate")
        .set("Authorization", `Bearer ${token}`)
        .send({ contactId, campaignId });
      await request(app)
        .patch(`/api/ai/suggestions/${gen.body.suggestionId}/accept`)
        .set("Authorization", `Bearer ${token}`);

      // Send with the suggestion
      const res = await request(app)
        .post("/api/messaging/send")
        .set("Authorization", `Bearer ${token}`)
        .send({
          contactId,
          campaignId,
          subject: gen.body.subject,
          body: gen.body.body,
          aiSuggestionId: gen.body.suggestionId,
        });
      expect(res.status).toBe(201);

      // Verify suggestion status is now 'sent'
      const suggestion = await request(app)
        .get(`/api/ai/suggestions/${gen.body.suggestionId}`)
        .set("Authorization", `Bearer ${token}`);
      expect(suggestion.body.status).toBe("sent");
    });
  });
});
