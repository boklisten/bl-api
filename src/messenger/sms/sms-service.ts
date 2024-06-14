import twilio from "twilio";

import { logger } from "../../logger/logger";

const accountSid = process.env["TWILIO_SMS_SID"];
const authToken = process.env["TWILIO_SMS_AUTH_TOKEN"];
const client = twilio(accountSid ?? "ACSid", authToken ?? "authToken", {
  autoRetry: true,
  maxRetries: 5,
});

/**
 * Send a single SMS to a single recipient
 * @param toNumber Norwegian phone number (without country code)
 * @param message The message to be sent, must be less than 280 characters
 */
export async function sendSMS(
  toNumber: string,
  message: string,
): Promise<void> {
  try {
    await client.messages.create({
      body: message,
      to: `+47${toNumber}`,
      from: "Boklisten",
    });
    logger.info(`successfully sent SMS to "${toNumber}"`);
  } catch (e) {
    logger.error(`failed to send SMS to "${toNumber}", reason: ${e}`);
    throw e;
  }
}

/**
 * Send SMS to a multiple receivers
 * @param toNumbers the Norwegian numbers to receive the message
 * @param message the message to be sent
 */
export async function massSendSMS(
  toNumbers: string[],
  message: string,
): Promise<Array<PromiseSettledResult<Awaited<Promise<void>>>>> {
  return Promise.allSettled(
    toNumbers.map((toNumber) => sendSMS(toNumber, message)),
  );
}
