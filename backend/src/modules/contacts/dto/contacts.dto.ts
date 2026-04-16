import { z } from "zod";

export type {
  CreateContactDTO,
  UpdateContactDTO,
  ContactResponseDTO,
  ContactListItemDTO,
} from "@pr-outreach/shared-types";

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
