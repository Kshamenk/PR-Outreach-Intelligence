import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import { pool } from "../../../config/db";
import { cleanDatabase, createTestUser } from "../../../__tests__/helpers";
import * as contactsService from "../../contacts/contacts.service";
import * as campaignsService from "../../campaigns/campaigns.service";

// Mock the AI provider to avoid real API calls
vi.mock("../ai.provider", () => ({
  generateCompletion: vi.fn().mockResolvedValue({
    subject: "Exciting news about our AI product",
    body: "Dear Sarah, I wanted to share some exciting developments...",
  }),
  getActiveModel: vi.fn().mockReturnValue("gpt-4o-mini-mock"),
}));

beforeAll(async () => {
  const schema = fs.readFileSync(path.resolve(__dirname, "../../../config/schema.sql"), "utf-8");
  await pool.query(schema);
});
afterAll(() => pool.end());

describe("AIService (integration)", () => {
  let userId: number;
  let contactId: number;
  let campaignId: number;

  beforeEach(async () => {
    await cleanDatabase();
    vi.clearAllMocks();
    const user = await createTestUser();
    userId = user.id;

    const contact = await contactsService.createContact(userId, {
      name: "Sarah Press", email: "sarah@tech.com", outlet: "TechCrunch", topics: ["AI"],
    });
    contactId = contact.id;

    const campaign = await campaignsService.createCampaign(userId, {
      name: "AI Launch", description: "Launch campaign", objective: "Get press coverage",
    });
    campaignId = campaign.id;
  });

  // Dynamic import so the mock is applied
  async function getService() {
    return await import("../ai.service");
  }

  describe("generate", () => {
    it("should generate outreach and store suggestion", async () => {
      const aiService = await getService();
      const result = await aiService.generate(userId, {
        contactId,
        campaignId,
        tone: "warm",
        length: "short",
      });

      expect(result.suggestionId).toBeGreaterThan(0);
      expect(result.subject).toBe("Exciting news about our AI product");
      expect(result.body).toContain("Sarah");
      expect(result.model).toBe("gpt-4o-mini-mock");
      expect(result.promptVersion).toBe("v1.0");
    });

    it("should throw NotFoundError for non-existent contact", async () => {
      const aiService = await getService();
      await expect(
        aiService.generate(userId, { contactId: 99999, campaignId })
      ).rejects.toThrow("Contact not found");
    });

    it("should throw NotFoundError for non-existent campaign", async () => {
      const aiService = await getService();
      await expect(
        aiService.generate(userId, { contactId, campaignId: 99999 })
      ).rejects.toThrow("Campaign not found");
    });

    it("should throw BadRequestError for archived contact", async () => {
      await contactsService.deleteContact(userId, contactId);
      const aiService = await getService();
      await expect(
        aiService.generate(userId, { contactId, campaignId })
      ).rejects.toThrow("Cannot generate outreach for an archived contact");
    });
  });

  describe("suggestion lifecycle", () => {
    it("should accept a suggestion", async () => {
      const aiService = await getService();
      const generated = await aiService.generate(userId, { contactId, campaignId });
      const accepted = await aiService.acceptSuggestion(userId, generated.suggestionId);
      expect(accepted.status).toBe("accepted");
    });

    it("should reject a suggestion with reason", async () => {
      const aiService = await getService();
      const generated = await aiService.generate(userId, { contactId, campaignId });
      const rejected = await aiService.rejectSuggestion(userId, generated.suggestionId, "Not relevant");
      expect(rejected.status).toBe("rejected");
    });

    it("should not accept an already-processed suggestion", async () => {
      const aiService = await getService();
      const generated = await aiService.generate(userId, { contactId, campaignId });
      await aiService.acceptSuggestion(userId, generated.suggestionId);
      await expect(
        aiService.acceptSuggestion(userId, generated.suggestionId)
      ).rejects.toThrow("Suggestion not found or already processed");
    });

    it("should list suggestions", async () => {
      const aiService = await getService();
      await aiService.generate(userId, { contactId, campaignId });
      await aiService.generate(userId, { contactId, campaignId });

      const result = await aiService.listSuggestions(userId, 50, 0);
      expect(result.total).toBe(2);
      expect(result.data).toHaveLength(2);
    });
  });
});
