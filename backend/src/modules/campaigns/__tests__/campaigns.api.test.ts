import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import request from "supertest";
import fs from "fs";
import path from "path";
import { pool } from "../../../config/db";
import { app, cleanDatabase, createTestUser, authToken } from "../../../__tests__/helpers";

let userId: number;
let token: string;

beforeAll(async () => {
  const schema = fs.readFileSync(path.resolve(__dirname, "../../../config/schema.sql"), "utf-8");
  await pool.query(schema);
});
afterAll(() => pool.end());

beforeEach(async () => {
  await cleanDatabase();
  const user = await createTestUser();
  userId = user.id;
  token = authToken(userId);
});

/** Helper: create a contact via API */
async function createContact(name = "Reporter", email = "r@press.com") {
  const res = await request(app)
    .post("/api/contacts")
    .set("Authorization", `Bearer ${token}`)
    .send({ name, email, outlet: "BBC", topics: ["tech"] });
  return res.body;
}

describe("Campaigns API", () => {
  const validCampaign = { name: "Q4 Launch", description: "Big launch", objective: "Coverage" };

  describe("POST /api/campaigns", () => {
    it("should create a campaign (201)", async () => {
      const res = await request(app)
        .post("/api/campaigns")
        .set("Authorization", `Bearer ${token}`)
        .send(validCampaign);
      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Q4 Launch");
      expect(res.body.status).toBe("draft");
    });

    it("should reject invalid body (400)", async () => {
      const res = await request(app)
        .post("/api/campaigns")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "" });
      expect(res.status).toBe(400);
    });

    it("should reject unauthenticated (401)", async () => {
      const res = await request(app).post("/api/campaigns").send(validCampaign);
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/campaigns", () => {
    it("should list campaigns (200)", async () => {
      await request(app).post("/api/campaigns").set("Authorization", `Bearer ${token}`).send(validCampaign);
      const res = await request(app).get("/api/campaigns").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
    });
  });

  describe("GET /api/campaigns/:id", () => {
    it("should return a campaign (200)", async () => {
      const created = await request(app).post("/api/campaigns").set("Authorization", `Bearer ${token}`).send(validCampaign);
      const res = await request(app)
        .get(`/api/campaigns/${created.body.id}`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Q4 Launch");
    });

    it("should return 404 for non-existent", async () => {
      const res = await request(app).get("/api/campaigns/99999").set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/campaigns/:id", () => {
    it("should update campaign (200)", async () => {
      const created = await request(app).post("/api/campaigns").set("Authorization", `Bearer ${token}`).send(validCampaign);
      const res = await request(app)
        .put(`/api/campaigns/${created.body.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated", status: "active" });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Updated");
      expect(res.body.status).toBe("active");
    });
  });

  describe("DELETE /api/campaigns/:id", () => {
    it("should soft-delete (204)", async () => {
      const created = await request(app).post("/api/campaigns").set("Authorization", `Bearer ${token}`).send(validCampaign);
      const res = await request(app)
        .delete(`/api/campaigns/${created.body.id}`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(204);
    });
  });

  describe("Participants", () => {
    it("should add contacts to a campaign (201)", async () => {
      const campaign = await request(app).post("/api/campaigns").set("Authorization", `Bearer ${token}`).send(validCampaign);
      const c1 = await createContact("A", "a@t.com");
      const c2 = await createContact("B", "b@t.com");

      const res = await request(app)
        .post(`/api/campaigns/${campaign.body.id}/contacts`)
        .set("Authorization", `Bearer ${token}`)
        .send({ contactIds: [c1.id, c2.id] });
      expect(res.status).toBe(201);
      expect(res.body.added).toBe(2);
    });

    it("should list participants (200)", async () => {
      const campaign = await request(app).post("/api/campaigns").set("Authorization", `Bearer ${token}`).send(validCampaign);
      const c = await createContact();
      await request(app)
        .post(`/api/campaigns/${campaign.body.id}/contacts`)
        .set("Authorization", `Bearer ${token}`)
        .send({ contactIds: [c.id] });

      const res = await request(app)
        .get(`/api/campaigns/${campaign.body.id}/contacts`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].contactName).toBe("Reporter");
    });

    it("should remove a contact from campaign (204)", async () => {
      const campaign = await request(app).post("/api/campaigns").set("Authorization", `Bearer ${token}`).send(validCampaign);
      const c = await createContact();
      await request(app)
        .post(`/api/campaigns/${campaign.body.id}/contacts`)
        .set("Authorization", `Bearer ${token}`)
        .send({ contactIds: [c.id] });

      const res = await request(app)
        .delete(`/api/campaigns/${campaign.body.id}/contacts/${c.id}`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(204);

      const list = await request(app)
        .get(`/api/campaigns/${campaign.body.id}/contacts`)
        .set("Authorization", `Bearer ${token}`);
      expect(list.body).toHaveLength(0);
    });

    it("should reject empty contactIds (400)", async () => {
      const campaign = await request(app).post("/api/campaigns").set("Authorization", `Bearer ${token}`).send(validCampaign);
      const res = await request(app)
        .post(`/api/campaigns/${campaign.body.id}/contacts`)
        .set("Authorization", `Bearer ${token}`)
        .send({ contactIds: [] });
      expect(res.status).toBe(400);
    });
  });
});
