import type { NextRequest } from "next/server";
import * as cheerio from "cheerio";

export const dynamic = "force-dynamic";

/* ─────────── helpers ────────────────────────────── */

/** безопасный fetch: сетевые ошибки превращаем в Response 502 */
async function safeFetch(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch {
    return new Response(null, { status: 502 });
  }
}

/** сначала локальный, при 404/502 пробуем удалённый */
async function fetchWithFallback(local: string, remote: string) {
  const first = await safeFetch(local);
  if (![404, 502].includes(first.status)) return first;
  const second = await safeFetch(remote);
  return second.status === 502 ? first : second;
}

/** подменяем url(/foo.png) и url(foo.png) внутри CSS */
function patchCss(css: string, site: string, base: string) {
  css = css.replace(
    /url\((['"]?)\/([^)'"]+)\1\)/g,
    (_, q, p) => `url(${q}/api/proxy/${site}/${p}${q})`
  );
  return css.replace(
    /url\((['"]?)(?!https?:|\/\/|data:)([^/'"][^)'"]+)\1\)/g,
    (_, q, p) => `url(${q}/api/proxy/${site}/${base}${p}${q})`
  );
}

/** абсолютный и относительный src/href → через /api/proxy */
function patchAttr($: cheerio.CheerioAPI, site: string) {
  $("[src],[href]").each((_, el) => {
    const $el = $(el);
    const tag = (el.tagName ?? "").toLowerCase();
    const attr = tag === "link" ? "href" : "src";
    const url = $el.attr(attr);
    if (!url) return;
    if (/^(https?:)?\/\//.test(url) || url.startsWith("/api/proxy/")) return;

    $el.attr(
      attr,
      url.startsWith("/")
        ? `/api/proxy/${site}${url}`
        : `/api/proxy/${site}/${url}`
    );
  });
}

/** background:url("/foo.png") в inline‑style */
function patchInlineStyle($: cheerio.CheerioAPI, site: string) {
  $("[style]").each((_, el) => {
    const $el = $(el);
    const s = $el.attr("style")!;
    const patched = s.replace(
      /url\((['"]?)\/([^)'"]+)\1\)/g,
      (_, q, p) => `url(${q}/api/proxy/${site}/${p}${q})`
    );
    if (patched !== s) $el.attr("style", patched);
  });
}

/** общие заголовки для отключения кеширования */
function getNoCacheHeaders(extraHeaders: Record<string, string> = {}) {
  return {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    "Surrogate-Control": "no-store",
    ...extraHeaders,
  };
}

/* ─────────── handler ────────────────────────────── */

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await context.params;

  const clean = slug[0] === "api" && slug[1] === "proxy" ? slug.slice(2) : slug;

  if (clean.length === 0 || !clean[0].includes(".")) {
    return new Response("not proxied", {
      status: 404,
      headers: getNoCacheHeaders({
        "Content-Type": "text/plain; charset=utf-8",
      }),
    });
  }

  const site = clean[0];
  const sub = clean.slice(1).join("/");
  const EXTRACTOR_URL = process.env.EXTRACTOR_URL || "http://localhost:5500";
  const local = `${EXTRACTOR_URL}/${site}${sub ? "/" + sub : ""}`;
  const remote = `https://${site}${sub ? "/" + sub : ""}`;

  console.log("→", local);

  const up = await fetchWithFallback(local, remote);
  const type = up.headers.get("content-type") ?? "";
  const buf = new Uint8Array(await up.arrayBuffer());

  if (type.includes("text/css")) {
    const base = sub.replace(/[^/]*$/, "");
    const css = patchCss(new TextDecoder().decode(buf), site, base);
    return new Response(css, {
      status: up.status,
      headers: getNoCacheHeaders({
        "Content-Type": "text/css; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      }),
    });
  }

  if (!type.includes("text/html")) {
    return new Response(buf, {
      status: up.status,
      headers: getNoCacheHeaders({
        "Content-Type": type,
        "Access-Control-Allow-Origin": "*",
      }),
    });
  }

  const $ = cheerio.load(new TextDecoder().decode(buf));

  const next = $("script#__NEXT_DATA__");
  if (next.length) {
    try {
      const json = JSON.parse(next.html()!);
      json.assetPrefix = `/api/proxy/${site}`;
      next.text(JSON.stringify(json));
    } catch {}
  }

  patchAttr($, site);
  patchInlineStyle($, site);

  return new Response($.html(), {
    status: up.status,
    headers: getNoCacheHeaders({
      "Content-Type": "text/html; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    }),
  });
}
