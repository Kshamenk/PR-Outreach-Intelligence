import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import { pool } from "../../../config/db";
import { cleanDatabase, createTestUser } from "../../../__tests__/helpers";
import * as interactionsService from "../interactions.service";
import * as contactsService from "../../contacts/contacts.service";
import * as campaignsService from "../../campaigns/campaigns.service";

beforeAll(async () => {
  const schema = fs.readFileSync(path.resolve(__dirname, "../../../config/schema.sql"), "utf-8");
  await pool.query(schema);
});
afterAll(() => pool.end());

describe("InteractionsService (integration)", () => {
  let userId: number;
  let contactId: number;
  let campaignId: number;

  beforeEach(async () => {
    await cleanDatabase();
    const user = await createTestUser();
    userId = user.id;
    const contact = await contactsService.createContact(userId, {
      name: "Reporter", email: "reporter@press.com", outlet: "BBC", topics: ["tech"],
    });
    contactId = contact.id;
    const campaign = await campaignsService.createCampaign(userId, {
      name: "Launch", description: "desc", objective: "coverage",
    });
    campaignId = campaign.id;
    await campaignsService.addContacts(userId, campaignId, { contactIds: [contactId] });
  });

  describe("createInteraction", () => {
    it("should create an outbound interaction and update contact", async () => {
      const result = await interactionsService.createInteraction(userId, {
        contactId,
        campaignId,
        direction: "outbound",
        channel: "email",
        status: "sent",
        subject: "Press inquiry",
        content: "Hello, I'd like to discuss your upcoming product launch.",
      });

      expect(result.id).toBeGreaterThan(0);
      expect(result.contactId).toBe(contactId);
      expect(result.campaignId).toBe(campaignId);
      expect(result.direction).toBe("outbound");
      expect(result.status).toBe("sent");

      // Verify contact last_contacted_at was updated
      const contact = await contactsService.getContact(userId, contactId);
      expect(contact.lastContactedAt).not.toBeNull();
    });

    it("should create an inbound interaction", async () => {
      const result = await interactionsService.createInteraction(userId, {
        contactId,
        direction: "inbound",
        channel: "email",
        status: "replied",
        subject: "Re: Press inquiry",
        content: "Thanks for reaching out!",
      });

      expect(result.direction).toBe("inbound");
      expect(result.status).toBe("replied");
    });

    it("should create a note interaction", async () => {
      const result = await interactionsService.createInteraction(userId, {
        contactId,
        direction: "internal",
        channel: "note",
        status: "draft",
        content: "Follow up next week about the launch.",
      });

      expect(result.channel).toBe("note");
      expect(result.direction).toBe("internal");
    });

    it("should throw NotFoundError for non-existent contact", async () => {
      await expect(
        interactionsService.createInteraction(userId, {
          contactId: 99999, direction: "outbound", channel: "email", status: "sent", content: "test",
        })
      ).rejects.toThrow("Contact not found");
    });

    it("should throw BadRequestError for archived contact", async () => {
      await contactsService.deleteContact(userId, contactId);
      await expect(
        interactionsService.createInteraction(userId, {
          contactId, direction: "outbound", channel: "email", status: "sent", content: "test",
        })
      ).rejects.toThrow("Cannot create interaction for an archived contact");
    });

    it("should recalculate relationship score after interaction", async () => {
      // Create outbound interaction (+1 to score)
      await interactionsService.createInteraction(userId, {
        contactId, direction: "outbound", channel: "email", status: "sent", content: "Hello",
      });
      const contact = await contactsService.getContact(userId, contactId);
      expect(contact.score).toBeGreaterThan(0);
    });
  });

  describe("getInteraction", () => {
    it("should return existing interaction", async () => {
      const created = await interactionsService.createInteraction(userId, {
        contactId, direction: "outbound", channel: "email", status: "sent", content: "test",
      });
      const result = await interactionsService.getInteraction(userId, created.id);
      expect(result.id).toBe(created.id);
    });

    it("should throw NotFoundError for non-existent", async () => {
      await expect(interactionsService.getInteraction(userId, 99999)).rejects.toThrow("Interaction not found");
    });
  });

  describe("listByContact", () => {
    it("should return interactions for a contact", async () => {
      await interactionsService.createInteraction(userId, {
        contactId, direction: "outbound", channel: "email", status: "sent", content: "msg1",
      });
      await interactionsService.createInteraction(userId, {
        contactId, direction: "inbound", channel: "email", status: "replied", content: "msg2",
      });

      const result = await interactionsService.listByContact(userId, contactId, 50, 0);
      expect(result.total).toBe(2);
      expect(result.data).toHaveLength(2);
    });
  });

  describe("listAll", () => {
    it("should return all interactions for the user", async () => {
      await interactionsService.createInteraction(userId, {
        contactId, direction: "outbound", channel: "email", status: "sent", content: "msg",
      });
      const result = await interactionsService.listAll(userId, 50, 0);
      expect(result.total).toBe(1);
    });
  });
});
