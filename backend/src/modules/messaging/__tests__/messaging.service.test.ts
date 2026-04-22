import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import { pool } from "../../../config/db";
import { cleanDatabase, createTestUser } from "../../../__tests__/helpers";
import * as contactsService from "../../contacts/contacts.service";
import * as campaignsService from "../../campaigns/campaigns.service";
import * as aiService from "../../ai/ai.service";

// Mock the email provider (console provider)
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

beforeAll(async () => {
  const schema = fs.readFileSync(path.resolve(__dirname, "../../../config/schema.sql"), "utf-8");
  await pool.query(schema);
});
afterAll(() => pool.end());

describe("MessagingService (integration)", () => {
  let userId: number;
  let contactId: number;
  let campaignId: number;

  beforeEach(async () => {
    await cleanDatabase();
    vi.clearAllMocks();
    const user = await createTestUser();
    userId = user.id;

    const contact = await contactsService.createContact(userId, {
      name: "Reporter", email: "reporter@news.com", outlet: "BBC", topics: ["tech"],
    });
    contactId = contact.id;

    const campaign = await campaignsService.createCampaign(userId, {
      name: "Launch", description: "desc", objective: "coverage",
    });
    campaignId = campaign.id;
    await campaignsService.addContacts(userId, campaignId, { contactIds: [contactId] });
  });

  // Dynamic import so mock is applied
  async function getService() {
    return await import("../messaging.service");
  }

  describe("send", () => {
    it("should send email and create interaction", async () => {
      const messagingService = await getService();
      const result = await messagingService.send(userId, {
        contactId,
        campaignId,
        subject: "Press Release",
        body: "Dear reporter, we have exciting news...",
      });

      expect(result.interactionId).toBeGreaterThan(0);
      expect(result.providerMessageId).toBe("mock_msg_001");
      expect(result.status).toBe("sent");
    });

    it("should update contact last_contacted_at", async () => {
      const messagingService = await getService();
      await messagingService.send(userId, {
        contactId,
        subject: "Hi",
        body: "Hello!",
      });

      const contact = await contactsService.getContact(userId, contactId);
      expect(contact.lastContactedAt).not.toBeNull();
    });

    it("should throw NotFoundError for non-existent contact", async () => {
      const messagingService = await getService();
      await expect(
        messagingService.send(userId, { contactId: 99999, subject: "Hi", body: "test" })
      ).rejects.toThrow("Contact not found");
    });

    it("should throw BadRequestError for archived contact", async () => {
      await contactsService.deleteContact(userId, contactId);
      const messagingService = await getService();
      await expect(
        messagingService.send(userId, { contactId, subject: "Hi", body: "test" })
      ).rejects.toThrow("Cannot send email to an archived contact");
    });

    it("should mark AI suggestion as sent when aiSuggestionId is provided", async () => {
      // Generate and accept a suggestion first
      const generated = await aiService.generate(userId, { contactId, campaignId });
      await aiService.acceptSuggestion(userId, generated.suggestionId);

      const messagingService = await getService();
      await messagingService.send(userId, {
        contactId,
        campaignId,
        subject: generated.subject,
        body: generated.body,
        aiSuggestionId: generated.suggestionId,
      });

      // Verify suggestion is now 'sent'
      const suggestion = await aiService.getSuggestion(userId, generated.suggestionId);
      expect(suggestion.status).toBe("sent");
    });

    it("should reject sending with non-accepted AI suggestion", async () => {
      const generated = await aiService.generate(userId, { contactId, campaignId });
      // Don't accept it — still in 'draft' status

      const messagingService = await getService();
      await expect(
        messagingService.send(userId, {
          contactId,
          subject: "Hi",
          body: "test",
          aiSuggestionId: generated.suggestionId,
        })
      ).rejects.toThrow("Cannot send: suggestion status is 'draft', expected 'accepted'");
    });
  });
});
