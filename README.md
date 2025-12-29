# SuperOps → Google Chat Webhook

Cloudflare Email Worker that receives BCC'd emails from SuperOps ticket notifications and posts formatted cards to Google Chat via webhook.

## How It Works

1. SuperOps sends ticket notification emails with your worker address in BCC
2. Cloudflare Email Routing forwards emails to the worker
3. Worker parses the email and extracts ticket data
4. Formatted card is posted to Google Chat via webhook

## Quick Start

### Step 1: Get Your Google Chat Webhook URL

1. Open Google Chat
2. Go to the space where you want notifications
3. Click the space name → **Apps & Integrations** → **Webhooks**
4. Click **Create webhook**, give it a name, copy the URL
5. Save this URL for Step 4

### Step 2: Set Up Cloudflare Email Routing

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your domain → **Email Routing** → **Settings**
3. Add a subdomain for email routing (e.g., `notifications.yourdomain.com`)
4. Add the MX and TXT records Cloudflare shows you

### Step 3: Create the Email Worker

1. **Email Routing** → **Email Workers** → **Create**
2. Name it whatever you want (e.g., `superops-tickets`)
3. Delete the default code
4. Copy everything from `worker.js` in this repo and paste it in
5. **IMPORTANT:** Change line 6 to your SuperOps domain:
   ```javascript
   const SUPEROPS_DOMAIN = "my.yourcompany.io";  // <-- YOUR DOMAIN HERE
   ```
6. Click **Save and deploy**

### Step 4: Add the Webhook Secret

1. **Workers & Pages** → click your worker → **Settings** → **Variables**
2. Under "Environment Variables", click **Add variable**
3. Variable name: `GCHAT_WEBHOOK`
4. Value: paste the webhook URL from Step 1
5. Click **Encrypt** (important!)
6. Click **Save**

### Step 5: Create Email Routing Rule

1. **Email Routing** → **Routing rules** → **Create address**
2. Custom address: `tickets` (or whatever you want)
3. Action: **Send to a Worker** → select your worker
4. Click **Save**

Your email address is now: `tickets@notifications.yourdomain.com`

### Step 6: Configure SuperOps

1. Go to SuperOps → **Settings** → **Notifications**
2. Edit your ticket notification templates (see templates below)
3. Add your worker email to the BCC field: `tickets@notifications.yourdomain.com`

Done! New tickets and replies will now post to Google Chat.

---

## SuperOps Email Templates

**You must use these exact templates** for the worker to parse emails correctly.

### New Ticket Template

```
Hi #Technician name,

A new ticket has been submitted.

Ticket #: #Ticket ID
Client: #Client name
Site: #Site name
Requester: #Requester name
Priority: #Ticket priority
Category: #Ticket category
Subject: #Subject

Description:
#Description

#Ticket link
```

### Reply Template

```
Hi #Technician name,

You have a new reply on ticket ##Ticket ID.

Client: #Client name
Site: #Site name
Requester: #Requester name
Priority: #Ticket priority
Status: #Ticket status
Subject: #Subject
Reply from: #Replied By

#Reply

#Ticket link
```

---

## Configuration Reference

| What to change | Where | Example |
|----------------|-------|---------|
| SuperOps domain | `worker.js` line 6 | `my.yourcompany.io` |
| Google Chat webhook | Cloudflare Worker Variables | `https://chat.googleapis.com/v1/spaces/...` |

---

## Troubleshooting

**Not getting any notifications?**
- Check your MX records are set up correctly for the subdomain
- Verify the routing rule points to your worker
- Make sure the BCC address in SuperOps matches your routing rule

**Getting notifications but data is wrong/missing?**
- Make sure your SuperOps templates match exactly (copy/paste from above)
- The labels like `Ticket #:`, `Client:`, `Priority:` must be exact

**Worker errors in Cloudflare logs?**
- Check `GCHAT_WEBHOOK` variable is set and encrypted
- Verify your Google Chat webhook URL is still valid

---

## Notes

- Content truncates at 500 characters to keep cards readable
- Using a subdomain keeps your main domain's email (Google Workspace, etc.) working normally
