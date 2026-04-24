import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import request from "supertest";
import fs from "fs";
import path from "path";
import { pool } from "../../../config/db";
import { app, cleanDatabase, createTestUser, authToken } from "../../../__tests__/helpers";

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
  const user = await createTestUser();
  token = authToken(user.id);

  // Seed a contact and campaign
  const contact = await request(app)
    .post("/api/contacts")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Reporter", email: "r@bbc.com", outlet: "BBC", topics: ["tech"] });
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

describe("Interactions API", () => {
  describe("POST /api/interactions", () => {
    it("should create an interaction (201)", async () => {
      const res = await request(app)
        .post("/api/interactions")
        .set("Authorization", `Bearer ${token}`)
        .send({
          contactId,
          campaignId,
          direction: "outbound",
          channel: "email",
          status: "sent",
          subject: "Press inquiry",
          content: "Hello, I wanted to discuss...",
        });
      expect(res.status).toBe(201);
      expect(res.body.id).toBeGreaterThan(0);
      expect(res.body.contactId).toBe(contactId);
      expect(res.body.direction).toBe("outbound");
    });

    it("should reject invalid direction (400)", async () => {
      const res = await request(app)
        .post("/api/interactions")
        .set("Authorization", `Bearer ${token}`)
        .send({
          contactId,
          direction: "sideways",
          channel: "email",
          status: "sent",
          content: "test",
        });
      expect(res.status).toBe(400);
    });

    it("should reject unauthenticated (401)", async () => {
      const res = await request(app)
        .post("/api/interactions")
        .send({ contactId, direction: "outbound", channel: "email", status: "sent", content: "x" });
      expect(res.status).toBe(401);
    });

    it("should reject non-existent contact (404)", async () => {
      const res = await request(app)
        .post("/api/interactions")
        .set("Authorization", `Bearer ${token}`)
        .send({
          contactId: 99999,
          direction: "outbound",
          channel: "email",
          status: "sent",
          content: "test",
        });
      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/interactions", () => {
    beforeEach(async () => {
      await request(app)
        .post("/api/interactions")
        .set("Authorization", `Bearer ${token}`)
        .send({ contactId, direction: "outbound", channel: "email", status: "sent", content: "msg1" });
      await request(app)
        .post("/api/interactions")
        .set("Authorization", `Bearer ${token}`)
        .send({ contactId, direction: "inbound", channel: "email", status: "replied", content: "msg2" });
    });

    it("should list all interactions (200)", async () => {
      const res = await request(app)
        .get("/api/interactions")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(2);
    });

    it("should filter by contactId", async () => {
      const res = await request(app)
        .get(`/api/interactions?contactId=${contactId}`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(2);
    });

    it("should filter by campaignId", async () => {
      // Create interaction with campaignId
      await request(app)
        .post("/api/interactions")
        .set("Authorization", `Bearer ${token}`)
        .send({ contactId, campaignId, direction: "outbound", channel: "email", status: "sent", content: "camp msg" });

      const res = await request(app)
        .get(`/api/interactions?campaignId=${campaignId}`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.total).toBeGreaterThanOrEqual(1);
    });
  });

  describe("GET /api/interactions/:id", () => {
    it("should return a single interaction (200)", async () => {
      const created = await request(app)
        .post("/api/interactions")
        .set("Authorization", `Bearer ${token}`)
        .send({ contactId, direction: "outbound", channel: "email", status: "sent", content: "test" });

      const res = await request(app)
        .get(`/api/interactions/${created.body.id}`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(created.body.id);
    });

    it("should return 404 for non-existent", async () => {
      const res = await request(app)
        .get("/api/interactions/99999")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });
});
