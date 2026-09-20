import indexHtmlTemplate from "./index.html";
import script from "./embeds/embed1.json";

const EMBEDS = { script };

const DISCORD_UA_RE = /discordbot/i;

function isDiscordCrawler(request) {
  const ua = request.headers.get("User-Agent") || "";
  return DISCORD_UA_RE.test(ua);
}

function notFound() {
  return new Response("Not Found", { status: 404 });
}

export default {
  async fetch(request) {
    if (!isDiscordCrawler(request)) {
      return notFound();
    }

    const url = new URL(request.url);

    if (url.pathname === "/embed-data.json") {
      const body = JSON.stringify(embedData);

      if (new TextEncoder().encode(body).length > 3000) {
        console.warn("json has exceeded Discord's 3,000-byte limit.");
      }

      return new Response(body, {
        status: 200,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }

    const embedJsonUrl = `${url.origin}/embed-data.json`;
    const html = indexHtmlTemplate
      .replaceAll("{{PAGE_URL}}", `${url.origin}${url.pathname}`)
      .replaceAll("{{EMBED_JSON_URL}}", embedJsonUrl);

    return new Response(html, {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  },
};
