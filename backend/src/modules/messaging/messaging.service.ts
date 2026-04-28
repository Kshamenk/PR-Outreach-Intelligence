import { pool } from "../../config/db";
import { NotFoundError, BadRequestError, AppError } from "../../shared/errors/AppError";
import * as contactsRepo from "../contacts/contacts.repository";
import * as campaignsRepo from "../campaigns/campaigns.repository";
import * as interactionsRepo from "../interactions/interactions.repository";
import * as aiRepo from "../ai/ai.repository";
import { logEvent } from "../../shared/audit/audit.repository";
import { sendEmail } from "./providers";
import type { SendEmailDTO, SendEmailResponseDTO } from "./dto/messaging.dto";

export async function send(
  userId: number,
  dto: SendEmailDTO
): Promise<SendEmailResponseDTO> {
  // 1. Validate contact
  const contact = await contactsRepo.findById(userId, dto.contactId);
  if (!contact) throw new NotFoundError("Contact not found");
  if (contact.archived_at)
    throw new BadRequestError("Cannot send email to an archived contact");

  // 2. Validate campaign (if provided)
  if (dto.campaignId) {
    const campaign = await campaignsRepo.findById(userId, dto.campaignId);
    if (!campaign) throw new NotFoundError("Campaign not found");
  }

  // 3. Lock and validate AI suggestion inside transaction to prevent TOCTOU
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    if (dto.aiSuggestionId) {
      const { rows: lockedRows } = await client.query<aiRepo.AISuggestionRow>(
        "SELECT * FROM ai_suggestions WHERE id = $1 AND user_id = $2 FOR UPDATE",
        [dto.aiSuggestionId, userId]
      );
      const suggestion = lockedRows[0] ?? null;
      if (!suggestion)
        throw new NotFoundError("AI suggestion not found");
      if (suggestion.status !== "accepted")
        throw new BadRequestError(
          `Cannot send: suggestion status is '${suggestion.status}', expected 'accepted'`
        );
    }

    // 4. Send via email provider
    const { providerMessageId } = await sendEmail(
      contact.email,
      dto.subject,
      dto.body
    );

    // 5. Record everything in the same transaction
    let interaction;
    try {
      interaction = await interactionsRepo.create(
        userId,
        dto.contactId,
        dto.campaignId ?? null,
        "outbound",
        "email",
        "sent",
        dto.body,
        dto.subject,
        null, // occurredAt = NOW()
        providerMessageId,
        null, // externalThreadId
        dto.aiSuggestionId
          ? { aiSuggestionId: dto.aiSuggestionId }
          : null,
        client
      );

      // Update contact last_contacted_at
      await interactionsRepo.updateContactLastContacted(dto.contactId, client);

      // Update campaign_contacts status
      if (dto.campaignId) {
        await interactionsRepo.updateCampaignContactStatus(
          dto.campaignId,
          dto.contactId,
          "contacted",
          client
        );
      }

      // Recalculate contact score
      await contactsRepo.recalculateScore(dto.contactId, client);

      // Mark AI suggestion as sent
      if (dto.aiSuggestionId) {
        await aiRepo.markSent(userId, dto.aiSuggestionId, client);
      }

      // Audit
      await logEvent(
        userId,
        "messaging",
        interaction.id,
        "created",
        {
          channel: "email",
          contactId: dto.contactId,
          campaignId: dto.campaignId ?? null,
          providerMessageId,
          aiSuggestionId: dto.aiSuggestionId ?? null,
        },
        client
      );

      await client.query("COMMIT");
    } catch (txErr) {
      await client.query("ROLLBACK");

      // Email was already sent — persist a minimal recovery record so it's not lost
      console.error("Transaction failed after email was sent. Persisting recovery record.", txErr);
      try {
        await pool.query(
          `INSERT INTO interactions
             (user_id, contact_id, campaign_id, direction, channel, status,
              content, subject, provider_message_id, metadata)
           VALUES ($1, $2, $3, 'outbound', 'email', 'sent', $4, $5, $6, $7)`,
          [
            userId, dto.contactId, dto.campaignId ?? null,
            dto.body, dto.subject, providerMessageId,
            JSON.stringify({ recovery: true, originalError: String(txErr) }),
          ]
        );
      } catch (recoveryErr) {
        console.error("CRITICAL: Recovery record also failed. Email sent without DB record:", {
          providerMessageId, contactId: dto.contactId, userId,
        }, recoveryErr);
      }
      throw txErr;
    }

    return {
      interactionId: interaction.id,
      providerMessageId,
      status: "sent",
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw err;
  } finally {
    client.release();
  }
}
