import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();
const POLL_INTERVAL = 3000;

// --- Integration Helpers ---

async function sendEmail(config: any, to: string, subject: string, text: string) {
  // Default to internal MailHog if no host specified
  const transporter = nodemailer.createTransport({
    host: config.host || 'mailhog',
    port: parseInt(config.port) || 1025,
    secure: false,
    auth: config.user ? { user: config.user, pass: config.pass } : undefined,
  });

  await transporter.sendMail({
    from: config.from || 'alert@openduty.io',
    to,
    subject,
    text,
  });
}

async function sendMatrixMessage(config: any, body: string) {
  if (!config.homeServer || !config.accessToken || !config.roomId) {
    throw new Error("Missing Matrix configuration");
  }
  const url = `${config.homeServer}/_matrix/client/v3/rooms/${config.roomId}/send/m.room.message`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      msgtype: "m.text",
      body: body
    })
  });
  if (!response.ok) throw new Error(`Matrix API Error: ${response.statusText}`);
}

async function sendWebhook(url: string, payload: any) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(`Webhook Error: ${response.statusText}`);
}

// --- Job Processor ---

async function processJob(job: any) {
  console.log(`[Worker] Processing job ${job.id} type ${job.type}`);
  
  try {
    if (job.type === 'RUNBOOK_STEP') {
      const { incidentId, actionType, target, stepId, runbookName } = job.payload;
      let content = '';
      
      // Get Incident for context
      const incident = await prisma.incident.findUnique({ where: { id: incidentId } });
      if (!incident) throw new Error("Incident not found");

      if (actionType === 'notify') {
        // Fetch enabled notification channels
        const channels = await prisma.notificationChannel.findMany({ where: { enabled: true } });
        const results = [];

        for (const channel of channels) {
            try {
                const config = channel.config as any;
                const message = `[Runbook: ${runbookName}] Step Action: ${target}\nIncident: ${incident.title} (${incident.severity})`;

                if (channel.type === 'email') {
                    // Target in runbook step overrides default email if looks like email, else use config default
                    const recipient = target?.includes('@') ? target : (config.defaultRecipient || 'team@openduty.io');
                    await sendEmail(config, recipient, `Runbook Action: ${incident.title}`, message);
                    results.push('Email sent');
                } else if (channel.type === 'matrix') {
                    await sendMatrixMessage(config, message);
                    results.push('Matrix sent');
                } else if (channel.type === 'mattermost' && config.webhookUrl) {
                    await sendWebhook(config.webhookUrl, { text: message });
                    results.push('Mattermost sent');
                } else if (channel.type === 'webhook' && config.url) {
                    await sendWebhook(config.url, { incident, message });
                    results.push('Webhook triggered');
                }
            } catch (e: any) {
                console.error(`Failed to send to channel ${channel.name}:`, e);
                results.push(`${channel.name} failed`);
            }
        }
        content = `[Automation] Notification broadcast: ${results.join(', ')}`;
        
      } else if (actionType === 'http') {
          // Direct HTTP step
          await sendWebhook(target, { incidentId, timestamp: new Date() });
          content = `[Automation] HTTP Webhook triggered at ${target}. Response: 200 OK.`;
      }

      // Add timeline event
      await prisma.timelineEvent.create({
        data: {
          incidentId,
          type: 'RUNBOOK_ACTION',
          content: content || `Step processed`,
          author: 'Automation Worker',
        },
      });
    }

    await prisma.job.update({
      where: { id: job.id },
      data: { status: 'COMPLETED' },
    });
    console.log(`[Worker] Job ${job.id} completed.`);

  } catch (error: any) {
    console.error(`[Worker] Job ${job.id} failed:`, error);
    await prisma.job.update({
      where: { id: job.id },
      data: { status: 'FAILED' },
    });
    // Log failure to timeline
    if (job.payload?.incidentId) {
        await prisma.timelineEvent.create({
            data: {
                incidentId: job.payload.incidentId,
                type: 'ALERT',
                content: `Automation Failed: ${error.message}`,
                author: 'System',
            }
        });
    }
  }
}

async function runWorker() {
  console.log('[Worker] Started. Polling for jobs...');
  while (true) {
    try {
      const job = await prisma.job.findFirst({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
      });

      if (job) {
        await prisma.job.update({
            where: { id: job.id },
            data: { status: 'PROCESSING' }
        });
        await processJob(job);
      } else {
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
      }
    } catch (error) {
      console.error('[Worker] Loop Error:', error);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

runWorker();
