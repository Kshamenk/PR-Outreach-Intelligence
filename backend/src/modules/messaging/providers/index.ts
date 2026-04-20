import { env } from "../../../config/env";
import { sendEmail as resendSend } from "./resend.provider";

export type { SendResult } from "./resend.provider";

async function consoleSend(
  to: string,
  subject: string,
  body: string
): Promise<{ providerMessageId: string }> {
  const id = `console_${Date.now()}`;
  console.log(
    `\n📧 [Console Email Provider]\n  To: ${to}\n  Subject: ${subject}\n  Body: ${body.slice(0, 200)}${body.length > 200 ? "…" : ""}\n  ID: ${id}\n`
  );
  return { providerMessageId: id };
}

const providers = {
  resend: resendSend,
  console: consoleSend,
} as const;

export function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<{ providerMessageId: string }> {
  const fn = providers[env.EMAIL_PROVIDER];
  return fn(to, subject, body);
}
