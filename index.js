// Discord 공식 문서(discord/discord-api-docs PR #8606, component-embeds.mdx) 기준:
//   - 페이지 자체는 User-Agent "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)"로 요청됨
//   - <link>로 연결된 JSON은 User-Agent "Discordbot/2.0"으로 별도 요청됨
// 두 경우 모두 "Discordbot" 문자열을 포함하므로 대소문자 무시 정규식 하나로 함께 처리합니다.
import indexHtmlTemplate from "./index.html";
import embedData from "./embed-data.json";

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
    // Discord 봇이 아닌 모든 요청(일반 브라우저 포함)은 경로에 상관없이 404 처리
    if (!isDiscordCrawler(request)) {
      return notFound();
    }

    const url = new URL(request.url);

    // linked JSON: <link rel="discord:component-embed" href="{origin}/embed-data.json">가 가리키는 경로
    if (url.pathname === "/embed-data.json") {
      const body = JSON.stringify(embedData);

      // 문서 기준 linked JSON은 원본 응답 바이트 기준 3,000바이트 제한이 있습니다.
      if (new TextEncoder().encode(body).length > 3000) {
        console.warn("embed-data.json이 Discord의 3,000바이트 제한을 초과했습니다.");
      }

      return new Response(body, {
        status: 200,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }

    // 그 외 경로(메인 페이지 등): discord:component-embed <link> 태그가 담긴 HTML 반환
    // href는 "절대 https URL이며 페이지와 동일 사이트여야 한다"는 규칙을 만족하도록
    // 요청 시점의 origin을 기준으로 채워 넣습니다.
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
