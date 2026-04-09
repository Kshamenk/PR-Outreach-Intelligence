import { NotFoundError } from "../../shared/errors/AppError";
import * as campaignsRepo from "./campaigns.repository";
import type {
  CreateCampaignDTO,
  UpdateCampaignDTO,
  AddContactsToCampaignDTO,
  CampaignResponseDTO,
  CampaignParticipantDTO,
} from "./dto/campaigns.dto";

function toResponseDTO(row: campaignsRepo.CampaignRow): CampaignResponseDTO {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    objective: row.objective,
    status: row.status as CampaignResponseDTO["status"],
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function toParticipantDTO(row: campaignsRepo.CampaignParticipantRow): CampaignParticipantDTO {
  return {
    campaignContactId: row.id,
    contactId: row.contact_id,
    contactName: row.contact_name,
    outlet: row.outlet,
    status: row.status,
    lastOutreachAt: row.last_outreach_at?.toISOString() ?? null,
  };
}

export async function createCampaign(
  userId: number,
  dto: CreateCampaignDTO
): Promise<CampaignResponseDTO> {
  const row = await campaignsRepo.create(userId, dto.name, dto.description, dto.objective);
  return toResponseDTO(row);
}

export async function getCampaign(
  userId: number,
  campaignId: number
): Promise<CampaignResponseDTO> {
  const row = await campaignsRepo.findById(userId, campaignId);
  if (!row) throw new NotFoundError("Campaign not found");
  return toResponseDTO(row);
}

export async function listCampaigns(userId: number): Promise<CampaignResponseDTO[]> {
  const rows = await campaignsRepo.findAllByUser(userId);
  return rows.map(toResponseDTO);
}

export async function updateCampaign(
  userId: number,
  campaignId: number,
  dto: UpdateCampaignDTO
): Promise<CampaignResponseDTO> {
  const row = await campaignsRepo.update(userId, campaignId, dto);
  if (!row) throw new NotFoundError("Campaign not found");
  return toResponseDTO(row);
}

export async function addContacts(
  userId: number,
  campaignId: number,
  dto: AddContactsToCampaignDTO
): Promise<{ added: number }> {
  const campaign = await campaignsRepo.findById(userId, campaignId);
  if (!campaign) throw new NotFoundError("Campaign not found");

  const added = await campaignsRepo.addContacts(campaignId, dto.contactIds);
  return { added };
}

export async function removeContact(
  userId: number,
  campaignId: number,
  contactId: number
): Promise<void> {
  const campaign = await campaignsRepo.findById(userId, campaignId);
  if (!campaign) throw new NotFoundError("Campaign not found");

  const removed = await campaignsRepo.removeContact(campaignId, contactId);
  if (!removed) throw new NotFoundError("Contact not in campaign");
}

export async function getParticipants(
  userId: number,
  campaignId: number
): Promise<CampaignParticipantDTO[]> {
  const campaign = await campaignsRepo.findById(userId, campaignId);
  if (!campaign) throw new NotFoundError("Campaign not found");

  const rows = await campaignsRepo.getParticipants(campaignId);
  return rows.map(toParticipantDTO);
}
