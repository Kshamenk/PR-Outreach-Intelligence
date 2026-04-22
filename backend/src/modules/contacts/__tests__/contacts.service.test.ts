import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import { pool } from "../../../config/db";
import { cleanDatabase, createTestUser } from "../../../__tests__/helpers";
import * as contactsService from "../contacts.service";

beforeAll(async () => {
  const schema = fs.readFileSync(path.resolve(__dirname, "../../../config/schema.sql"), "utf-8");
  await pool.query(schema);
});
afterAll(() => pool.end());

describe("ContactsService (integration)", () => {
  let userId: number;

  beforeEach(async () => {
    await cleanDatabase();
    const user = await createTestUser();
    userId = user.id;
  });

  describe("createContact", () => {
    it("should create a contact and return response DTO", async () => {
      const result = await contactsService.createContact(userId, {
        name: "Alice Press",
        email: "alice@media.com",
        outlet: "TechCrunch",
        topics: ["AI", "startups"],
      });

      expect(result.id).toBeGreaterThan(0);
      expect(result.name).toBe("Alice Press");
      expect(result.email).toBe("alice@media.com");
      expect(result.outlet).toBe("TechCrunch");
      expect(result.topics).toEqual(["AI", "startups"]);
      expect(result.score).toBe(0);
      expect(result.archivedAt).toBeNull();
    });
  });

  describe("getContact", () => {
    it("should return an existing contact", async () => {
      const created = await contactsService.createContact(userId, {
        name: "Bob", email: "bob@test.com", outlet: "CNN", topics: [],
      });
      const result = await contactsService.getContact(userId, created.id);
      expect(result.id).toBe(created.id);
      expect(result.name).toBe("Bob");
    });

    it("should throw NotFoundError for non-existent contact", async () => {
      await expect(contactsService.getContact(userId, 99999)).rejects.toThrow("Contact not found");
    });

    it("should not return contacts from another user", async () => {
      const created = await contactsService.createContact(userId, {
        name: "Alice", email: "a@b.com", outlet: "", topics: [],
      });
      const otherUser = await createTestUser("other@test.com");
      await expect(contactsService.getContact(otherUser.id, created.id)).rejects.toThrow("Contact not found");
    });
  });

  describe("listContacts", () => {
    it("should return paginated contacts for the user", async () => {
      await contactsService.createContact(userId, { name: "A", email: "a@t.com", outlet: "", topics: [] });
      await contactsService.createContact(userId, { name: "B", email: "b@t.com", outlet: "", topics: [] });

      const result = await contactsService.listContacts(userId, 50, 0);
      expect(result.total).toBe(2);
      expect(result.data).toHaveLength(2);
    });

    it("should exclude archived contacts", async () => {
      const c = await contactsService.createContact(userId, { name: "X", email: "x@t.com", outlet: "", topics: [] });
      await contactsService.deleteContact(userId, c.id);

      const result = await contactsService.listContacts(userId, 50, 0);
      expect(result.total).toBe(0);
    });

    it("should respect pagination", async () => {
      for (let i = 0; i < 5; i++) {
        await contactsService.createContact(userId, { name: `C${i}`, email: `c${i}@t.com`, outlet: "", topics: [] });
      }
      const page = await contactsService.listContacts(userId, 2, 0);
      expect(page.data).toHaveLength(2);
      expect(page.total).toBe(5);
    });
  });

  describe("updateContact", () => {
    it("should update specified fields", async () => {
      const c = await contactsService.createContact(userId, { name: "Old", email: "old@t.com", outlet: "X", topics: [] });
      const updated = await contactsService.updateContact(userId, c.id, { name: "New", outlet: "Y" });
      expect(updated.name).toBe("New");
      expect(updated.outlet).toBe("Y");
      expect(updated.email).toBe("old@t.com"); // unchanged
    });

    it("should throw NotFoundError for non-existent contact", async () => {
      await expect(contactsService.updateContact(userId, 99999, { name: "X" })).rejects.toThrow("Contact not found");
    });

    it("should throw BadRequestError when updating archived contact", async () => {
      const c = await contactsService.createContact(userId, { name: "A", email: "a@t.com", outlet: "", topics: [] });
      await contactsService.deleteContact(userId, c.id);
      await expect(contactsService.updateContact(userId, c.id, { name: "B" })).rejects.toThrow("Cannot update an archived contact. Restore it first.");
    });
  });

  describe("deleteContact (soft delete)", () => {
    it("should set archived_at", async () => {
      const c = await contactsService.createContact(userId, { name: "Del", email: "del@t.com", outlet: "", topics: [] });
      await contactsService.deleteContact(userId, c.id);
      const result = await contactsService.getContact(userId, c.id);
      expect(result.archivedAt).not.toBeNull();
    });

    it("should throw NotFoundError for non-existent contact", async () => {
      await expect(contactsService.deleteContact(userId, 99999)).rejects.toThrow("Contact not found");
    });

    it("should throw NotFoundError when archiving already-archived contact", async () => {
      const c = await contactsService.createContact(userId, { name: "D", email: "d@t.com", outlet: "", topics: [] });
      await contactsService.deleteContact(userId, c.id);
      await expect(contactsService.deleteContact(userId, c.id)).rejects.toThrow("Contact not found");
    });
  });
});
