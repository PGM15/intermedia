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

export const sendSlackError = async ({ err, req }) => {
  const stack = err.stack ? err.stack.slice(0, 1500) : "Sin stack";

  await sendSlackNotification({
    text: `Error 5XX en ${req.method} ${req.originalUrl}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: [
            "*Error 5XX HTTP*",
            `*Timestamp:* ${new Date().toISOString()}`,
            `*Ruta:* ${req.originalUrl}`,
            `*Método:* ${req.method}`,
            `*Mensaje:* ${err.message || "Error interno del servidor"}`,
            `*Stack:* \`\`\`${stack}\`\`\``,
          ].join("\n"),
        },
      },
    ],
  });
};
