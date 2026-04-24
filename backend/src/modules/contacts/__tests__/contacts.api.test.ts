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

describe("Contacts API", () => {
  const validContact = {
    name: "Alice Reporter",
    email: "alice@press.com",
    outlet: "TechCrunch",
    topics: ["AI", "startups"],
  };

  describe("POST /api/contacts", () => {
    it("should create a contact (201)", async () => {
      const res = await request(app)
        .post("/api/contacts")
        .set("Authorization", `Bearer ${token}`)
        .send(validContact);
      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Alice Reporter");
      expect(res.body.email).toBe("alice@press.com");
      expect(res.body.id).toBeGreaterThan(0);
      expect(res.body.score).toBe(0);
    });

    it("should reject invalid body (400)", async () => {
      const res = await request(app)
        .post("/api/contacts")
        .set("Authorization", `Bearer ${token}`)
        .send({ email: "not-valid" });
      expect(res.status).toBe(400);
    });

    it("should reject unauthenticated request (401)", async () => {
      const res = await request(app).post("/api/contacts").send(validContact);
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/contacts", () => {
    it("should list contacts with pagination (200)", async () => {
      await request(app).post("/api/contacts").set("Authorization", `Bearer ${token}`).send(validContact);
      await request(app).post("/api/contacts").set("Authorization", `Bearer ${token}`)
        .send({ name: "Bob", email: "bob@press.com" });

      const res = await request(app)
        .get("/api/contacts")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(2);
      expect(res.body.data).toHaveLength(2);
    });

    it("should respect limit and offset", async () => {
      for (let i = 0; i < 5; i++) {
        await request(app).post("/api/contacts").set("Authorization", `Bearer ${token}`)
          .send({ name: `C${i}`, email: `c${i}@t.com` });
      }
      const res = await request(app)
        .get("/api/contacts?limit=2&offset=0")
        .set("Authorization", `Bearer ${token}`);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.total).toBe(5);
    });

    it("should not return contacts from another user", async () => {
      await request(app).post("/api/contacts").set("Authorization", `Bearer ${token}`).send(validContact);

      const other = await createTestUser("other@test.com");
      const otherToken = authToken(other.id, other.email);
      const res = await request(app)
        .get("/api/contacts")
        .set("Authorization", `Bearer ${otherToken}`);
      expect(res.body.total).toBe(0);
    });
  });

  describe("GET /api/contacts/:id", () => {
    it("should return a single contact (200)", async () => {
      const created = await request(app).post("/api/contacts").set("Authorization", `Bearer ${token}`).send(validContact);
      const res = await request(app)
        .get(`/api/contacts/${created.body.id}`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Alice Reporter");
    });

    it("should return 404 for non-existent", async () => {
      const res = await request(app)
        .get("/api/contacts/99999")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(404);
    });

    it("should return 400 for invalid ID", async () => {
      const res = await request(app)
        .get("/api/contacts/abc")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(400);
    });
  });

  describe("PUT /api/contacts/:id", () => {
    it("should update contact fields (200)", async () => {
      const created = await request(app).post("/api/contacts").set("Authorization", `Bearer ${token}`).send(validContact);
      const res = await request(app)
        .put(`/api/contacts/${created.body.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated Name" });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Updated Name");
      expect(res.body.email).toBe("alice@press.com"); // unchanged
    });

    it("should return 404 for non-existent contact", async () => {
      const res = await request(app)
        .put("/api/contacts/99999")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "X" });
      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/contacts/:id", () => {
    it("should soft-delete a contact (204)", async () => {
      const created = await request(app).post("/api/contacts").set("Authorization", `Bearer ${token}`).send(validContact);
      const res = await request(app)
        .delete(`/api/contacts/${created.body.id}`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(204);

      // Should be excluded from list
      const list = await request(app).get("/api/contacts").set("Authorization", `Bearer ${token}`);
      expect(list.body.total).toBe(0);
    });

    it("should return 404 for non-existent", async () => {
      const res = await request(app)
        .delete("/api/contacts/99999")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(404);
    });
  });
});
