# SuperOps → Google Chat Webhook

Cloudflare Email Worker that receives BCC'd emails from SuperOps ticket notifications and posts formatted cards to Google Chat via webhook.

## How It Works

1. SuperOps sends ticket notification emails with your worker address in BCC
2. Cloudflare Email Routing forwards emails to the worker
3. Worker parses the email and extracts ticket data
4. Formatted card is posted to Google Chat via webhook

## Setup

### 1. Configure the Worker

Edit `src/index.js` and update the configuration at the top:

```javascript
// Your SuperOps subdomain (e.g., "my.yourcompany.io" or "app.superops.ai")
const SUPEROPS_DOMAIN = "my.yourcompany.io";  // <-- Change this
```

### 2. Configure Wrangler

Edit `wrangler.toml` and set your worker name:

```toml
name = "your-worker-name"  # <-- Change this
```

### 3. Cloudflare Email Routing

Set up email routing for your domain or subdomain:

1. Cloudflare Dashboard → Email Routing → Settings
2. Add your domain/subdomain for email routing
3. Configure MX and TXT records as prompted

### 4. Deploy the Worker

```bash
npm install -g wrangler
wrangler login
wrangler deploy
wrangler secret put GCHAT_WEBHOOK
# Paste your Google Chat webhook URL when prompted
```

### 5. Create Email Routing Rule

1. Cloudflare Dashboard → Email Routing → Routing rules
2. Create custom address (e.g., `tickets`)
3. Action: Send to Worker → select your deployed worker

### 6. Google Chat Webhook

1. Open your Google Chat space
2. Apps & Integrations → Webhooks → Create
3. Copy the webhook URL
4. Add as `GCHAT_WEBHOOK` secret (step 4 above)

### 7. SuperOps Configuration

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

## Configuration Reference

| Item | Location | Description |
|------|----------|-------------|
| `SUPEROPS_DOMAIN` | `src/index.js` | Your SuperOps instance domain |
| `name` | `wrangler.toml` | Cloudflare Worker name |
| `GCHAT_WEBHOOK` | Cloudflare secret | Google Chat webhook URL |

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
- Verify `GCHAT_WEBHOOK` secret is set correctly
- Check webhook URL is still valid in Google Chat space
