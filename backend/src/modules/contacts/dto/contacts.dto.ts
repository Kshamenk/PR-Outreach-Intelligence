import { z } from "zod";

export const createContactSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  outlet: z.string().max(255).default(""),
  topics: z.array(z.string()).default([]),
});

export const updateContactSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  outlet: z.string().max(255).optional(),
  topics: z.array(z.string()).optional(),
  archivedAt: z.string().datetime().nullable().optional(),
});

export type CreateContactDTO = z.infer<typeof createContactSchema>;
export type UpdateContactDTO = z.infer<typeof updateContactSchema>;

export interface ContactResponseDTO {
  id: number;
  name: string;
  email: string;
  outlet: string;
  topics: string[];
  score: number;
  lastContactedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContactListItemDTO {
  id: number;
  name: string;
  outlet: string;
  score: number;
  lastContactedAt: string | null;
  campaignCount: number;
}
