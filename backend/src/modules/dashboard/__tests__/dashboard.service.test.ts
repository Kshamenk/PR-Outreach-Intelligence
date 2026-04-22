import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import { pool } from "../../../config/db";
import { cleanDatabase, createTestUser } from "../../../__tests__/helpers";
import * as dashboardService from "../dashboard.service";
import * as contactsService from "../../contacts/contacts.service";
import * as campaignsService from "../../campaigns/campaigns.service";

beforeAll(async () => {
  const schema = fs.readFileSync(path.resolve(__dirname, "../../../config/schema.sql"), "utf-8");
  await pool.query(schema);
});
afterAll(() => pool.end());

describe("DashboardService (integration)", () => {
  let userId: number;

  beforeEach(async () => {
    await cleanDatabase();
    const user = await createTestUser();
    userId = user.id;
  });

  describe("getStats", () => {
    it("should return zero stats for new user", async () => {
      const stats = await dashboardService.getStats(userId);
      expect(stats.totalContacts).toBe(0);
      expect(stats.activeCampaigns).toBe(0);
      expect(stats.emailsSent).toBe(0);
      expect(stats.repliesReceived).toBe(0);
      expect(stats.responseRate).toBe(0);
      expect(stats.draftsPendingReview).toBe(0);
    });

    it("should count contacts and campaigns correctly", async () => {
      await contactsService.createContact(userId, { name: "A", email: "a@t.com", outlet: "", topics: [] });
      await contactsService.createContact(userId, { name: "B", email: "b@t.com", outlet: "", topics: [] });
      const camp = await campaignsService.createCampaign(userId, { name: "C", description: "", objective: "" });
      await campaignsService.updateCampaign(userId, camp.id, { status: "active" });

      const stats = await dashboardService.getStats(userId);
      expect(stats.totalContacts).toBe(2);
      expect(stats.activeCampaigns).toBe(1);
    });

    it("should not count archived contacts", async () => {
      const c = await contactsService.createContact(userId, { name: "X", email: "x@t.com", outlet: "", topics: [] });
      await contactsService.deleteContact(userId, c.id);

      const stats = await dashboardService.getStats(userId);
      expect(stats.totalContacts).toBe(0);
    });
  });

  describe("getRecentActivity", () => {
    it("should return recent audit events", async () => {
      await contactsService.createContact(userId, { name: "A", email: "a@t.com", outlet: "", topics: [] });

      const activity = await dashboardService.getRecentActivity(userId);
      expect(activity.length).toBeGreaterThan(0);
      expect(activity[0].type).toBe("contact_created");
      expect(activity[0].title).toContain("A");
    });

    it("should return empty array for no activity", async () => {
      const activity = await dashboardService.getRecentActivity(userId);
      // Only the register audit event from createTestUser
      // Actually createTestUser bypasses the service so no audit event
      expect(activity).toEqual([]);
    });
  });
});
