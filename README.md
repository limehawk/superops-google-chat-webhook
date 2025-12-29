# SuperOps → Google Chat Webhook

Cloudflare Email Worker that receives BCC'd emails from SuperOps ticket notifications and posts formatted cards to Google Chat via webhook.

## How It Works

1. SuperOps sends ticket notification emails with your worker address in BCC
2. Cloudflare Email Routing forwards emails to the worker
3. Worker parses the email and extracts ticket data
4. Formatted card is posted to Google Chat via webhook

## Setup

### 1. Cloudflare Email Routing

Set up email routing for your domain or subdomain:

1. Cloudflare Dashboard → Email Routing → Settings
2. Add your domain/subdomain for email routing
3. Configure MX and TXT records as prompted

### 2. Create the Email Worker

1. Cloudflare Dashboard → Email Routing → Email Workers → Create
2. Copy the contents of `src/index.js` into the editor
3. Update `SUPEROPS_DOMAIN` at the top to your SuperOps instance:
   ```javascript
   const SUPEROPS_DOMAIN = "my.yourcompany.io";  // <-- Change this
   ```
4. Save and deploy

### 3. Add the Webhook Secret

1. Workers & Pages → your worker → Settings → Variables
2. Add environment variable: `GCHAT_WEBHOOK`
3. Paste your Google Chat webhook URL
4. Click "Encrypt" to make it a secret

### 4. Create Email Routing Rule

1. Email Routing → Routing rules → Create address
2. Custom address (e.g., `tickets`)
3. Action: Send to Worker → select your worker

### 5. Google Chat Webhook

1. Open your Google Chat space
2. Apps & Integrations → Webhooks → Create
3. Copy the webhook URL for step 3 above

### 6. SuperOps Configuration

1. Update notification templates (see below)
2. Add your worker email address to BCC on ticket notifications
   - Example: `tickets@notifications.yourdomain.com`

## SuperOps Email Templates

These templates are required for the worker to parse emails correctly.

### New Ticket Template

```
Hi #Technician name,

A new ticket has been submitted.

Ticket #: #Ticket ID
Client: #Client name
Requester: #Requester name
Priority: #Ticket priority
Subject: #Subject

Description:
#Description

#Ticket link

Cheers,
#Organization email signature
```

### Reply Template

```
Hi #Technician name,

You have a new reply on ticket ##Ticket ID.

Client: #Client name
Subject: #Subject
Reply from: #Replied By

#Reply

#Ticket link

Cheers,
#Organization email signature
```

## Configuration

| Item | Location | Description |
|------|----------|-------------|
| `SUPEROPS_DOMAIN` | `src/index.js` | Your SuperOps instance domain |
| `GCHAT_WEBHOOK` | Worker Settings → Variables | Google Chat webhook URL (encrypt as secret) |

## Notes

- Reply content truncates at 200 chars (Google Chat card limitation)
- Email signatures get included but truncated - users click "Open Ticket" for full content
- Worker strips quoted-printable encoding and HTML artifacts
- Using a subdomain for email routing keeps existing email services on main domain intact

## Troubleshooting

**Emails not arriving at worker:**
- Check MX records are configured for your email domain
- Verify routing rule is active and points to correct worker

**Ticket data not parsing:**
- Ensure SuperOps templates match exactly (labels like "Ticket #:", "Client:", etc.)
- Check worker logs in Cloudflare dashboard

**Cards not posting to Google Chat:**
- Verify `GCHAT_WEBHOOK` variable is set and encrypted
- Check webhook URL is still valid in Google Chat space
