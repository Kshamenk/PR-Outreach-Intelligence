import { AppError } from "../../../shared/errors/AppError";
import { env } from "../../../config/env";

export interface SendResult {
  providerMessageId: string;
}

const TIMEOUT_MS = 15_000;

export async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<SendResult> {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    throw new AppError("Resend API key is not configured (RESEND_API_KEY)", 503);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: `${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM_ADDRESS}>`,
        to: [to],
        subject,
        text: body,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = (err as any)?.message ?? `Resend returned ${res.status}`;
      throw new AppError(`Email send failed: ${msg}`, 502);
    }

    const data = await res.json();
    if (!data.id) {
      throw new AppError("Resend returned no message ID", 502);
    }

    return { providerMessageId: data.id };
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    if (err.name === "AbortError") {
      throw new AppError("Email send timed out", 504);
    }
    throw new AppError(`Email send failed: ${err.message}`, 502);
  } finally {
    clearTimeout(timeout);
  }
}
