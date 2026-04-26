import { IncomingWebhook } from "@slack/webhook";

const webhookUrl = process.env.SLACK_WEBHOOK_URL;
const slackEnabled = process.env.SLACK_NOTIFICATIONS_ENABLED === "true";

const webhook = webhookUrl ? new IncomingWebhook(webhookUrl) : null;

export const sendSlackNotification = async ({ text, blocks }) => {
  try {
    if (!slackEnabled || !webhook) {
      return;
    }

    await webhook.send({
      text,
      blocks,
    });
  } catch (error) {
    console.error("Slack notification error:", error.message);
  }
};