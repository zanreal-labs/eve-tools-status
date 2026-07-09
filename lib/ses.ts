import { SESv2Client } from "@aws-sdk/client-sesv2";
import { awsCredentialsProvider } from "@vercel/functions/oidc";

/**
 * SES client wired through Vercel OIDC — same pattern as the other ZanReal
 * sites (etaxpro, hareborne, ishots-wedding).
 *
 * Required env vars:
 *  - AWS_ROLE_ARN   IAM role trusting the team's Vercel OIDC issuer
 *                   (e.g. arn:aws:iam::<account>:role/eve-tools-status-ses)
 *
 * Sender identity is the shared, verified "ZanReal Websites" address.
 * Region fixed to eu-central-1 like every other ZanReal SES sender.
 */

export const SES_FROM = "ZanReal Websites <websites@zanreal.com>";
export const SES_REGION = "eu-central-1";

let cachedClient: SESv2Client | null = null;

export function sesConfigured(): boolean {
  return Boolean(process.env.AWS_ROLE_ARN);
}

export function getSesClient(): SESv2Client {
  if (cachedClient) return cachedClient;
  const roleArn = process.env.AWS_ROLE_ARN;
  cachedClient = new SESv2Client({
    region: SES_REGION,
    ...(roleArn ? { credentials: awsCredentialsProvider({ roleArn }) } : {}),
  });
  return cachedClient;
}
