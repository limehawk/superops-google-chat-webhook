// =============================================================================
// CONFIGURATION - Update these values for your SuperOps instance
// =============================================================================

// Your SuperOps subdomain (e.g., "my.yourcompany.io" or "app.superops.ai")
const SUPEROPS_DOMAIN = "my.limehawk.io";

// Fallback URL when ticket link can't be extracted
const FALLBACK_URL = `https://${SUPEROPS_DOMAIN}`;

// =============================================================================

export default {
  async fetch(request, env, ctx) {
    return new Response("Email worker - not a web endpoint", { status: 200 });
  },

  async email(message, env, ctx) {
    const subject = message.headers.get("subject") || "";
    const rawEmail = await new Response(message.raw).text();
    const decoded = decodeEmail(rawEmail);

    const bodyStart = decoded.indexOf("<html>");
    const body = bodyStart > -1 ? decoded.substring(bodyStart) : decoded;

    const isReply = subject.toLowerCase().includes("replied to");
    const ticketData = parseTicketData(body, isReply);

    const chatPayload = isReply
      ? buildReplyCard(ticketData)
      : buildNewTicketCard(ticketData);

    await fetch(env.GCHAT_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chatPayload)
    });
  }
};

function decodeEmail(raw) {
  return raw
    .replace(/=\r\n/g, "")
    .replace(/=([0-9A-F]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\r\n/g, "\n");
}

function cleanText(text) {
  return text
    .replace(/\xA0/g, " ")
    .replace(/Â/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseTicketData(body, isReply) {
  return {
    ticketId: cleanText(extractAfterLabel(body, "Ticket #:") || extractAfterLabel(body, "ticket #")).replace(/\.$/, ""),
    client: cleanText(extractAfterLabel(body, "Client:")),
    subject: cleanText(extractAfterLabel(body, "Subject:")),
    ticketUrl: extractUrl(body),
    priority: cleanText(extractAfterLabel(body, "Priority:")),
    requester: cleanText(extractAfterLabel(body, "Requester:")),
    description: extractDescription(body),
    repliedBy: cleanText(extractAfterLabel(body, "Reply from:")),
    replyContent: extractReplyContent(body)
  };
}

function extractAfterLabel(text, label) {
  const labelIndex = text.toLowerCase().indexOf(label.toLowerCase());
  if (labelIndex === -1) return "";

  const afterLabel = text.substring(labelIndex + label.length);
  const spanMatch = afterLabel.match(/[^>]*>([^<]+)</);
  if (spanMatch) {
    return spanMatch[1];
  }

  return "";
}

function extractUrl(text) {
  // Build regex from configured domain
  const escapedDomain = SUPEROPS_DOMAIN.replace(/\./g, "\\.");
  const pattern = new RegExp(`https://${escapedDomain}/#/tickets/\\d+/ticket`);
  const match = text.match(pattern);
  return match ? match[0] : "";
}

function extractDescription(body) {
  const descIndex = body.indexOf("Description:");
  if (descIndex === -1) return "";

  const afterDesc = body.substring(descIndex);
  const divMatch = afterDesc.match(/<div>([^<]+)<\/div>/i);
  if (!divMatch) return "";

  let content = divMatch[1]
    .replace(/&nbsp;/g, " ")
    .replace(/\xA0/g, " ")
    .replace(/Â/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (content.length > 500) {
    content = content.substring(0, 500).trim() + "...";
  }

  return content;
}

function extractReplyContent(body) {
  const replyMarker = 'data-value="Reply">';
  const replyStart = body.indexOf(replyMarker);
  if (replyStart === -1) return "";

  let afterReply = body.substring(replyStart + replyMarker.length);

  const divMatch = afterReply.match(/<div>\s*([\s\S]*?)\s*<\/div>/i);
  if (!divMatch) return "";

  let content = divMatch[1]
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\xA0/g, " ")
    .replace(/Â/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (content.length > 500) {
    content = content.substring(0, 500).trim() + "...";
  }

  return content || "No content";
}

function buildNewTicketCard(data) {
  const widgets = [];

  if (data.client) {
    widgets.push({ decoratedText: { topLabel: "🏢 Client", text: data.client } });
  }
  if (data.requester) {
    widgets.push({ decoratedText: { topLabel: "👤 Requester", text: data.requester } });
  }
  if (data.priority) {
    widgets.push({ decoratedText: { topLabel: "🚨 Priority", text: data.priority } });
  }
  if (data.description) {
    widgets.push({ decoratedText: { topLabel: "📝 Description", text: data.description } });
  }

  widgets.push({
    buttonList: {
      buttons: [{
        text: "🔗 Open Ticket",
        onClick: { openLink: { url: data.ticketUrl || FALLBACK_URL } }
      }]
    }
  });

  return {
    cardsV2: [{
      cardId: "new-ticket",
      card: {
        header: {
          title: `🎫 #${data.ticketId}: ${data.subject || "No subject"}`,
          subtitle: "New Ticket"
        },
        sections: [{ widgets }]
      }
    }]
  };
}

function buildReplyCard(data) {
  const widgets = [];

  if (data.client) {
    widgets.push({ decoratedText: { topLabel: "🏢 Client", text: data.client } });
  }
  if (data.requester) {
    widgets.push({ decoratedText: { topLabel: "👤 Requester", text: data.requester } });
  }
  if (data.priority) {
    widgets.push({ decoratedText: { topLabel: "🚨 Priority", text: data.priority } });
  }
  if (data.replyContent) {
    widgets.push({ decoratedText: { topLabel: `💬 ${data.repliedBy || "Reply"}`, text: data.replyContent } });
  }

  widgets.push({
    buttonList: {
      buttons: [{
        text: "🔗 Open Ticket",
        onClick: { openLink: { url: data.ticketUrl || FALLBACK_URL } }
      }]
    }
  });

  return {
    cardsV2: [{
      cardId: "ticket-reply",
      card: {
        header: {
          title: `💬 #${data.ticketId}: ${data.subject || "No subject"}`,
          subtitle: "Ticket Reply"
        },
        sections: [{ widgets }]
      }
    }]
  };
}
