import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

const MAX_CHARS = 8000; // ~2000 tokens — enough context without blowing prompt budget

// Convert Google Docs/Slides/Sheets share URLs to plain-text export URLs
function resolveUrl(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);

    // Google Docs  →  export as plain text
    if (u.hostname === "docs.google.com") {
      const docMatch = u.pathname.match(/\/document\/d\/([^/]+)/);
      const slideMatch = u.pathname.match(/\/presentation\/d\/([^/]+)/);
      const sheetMatch = u.pathname.match(/\/spreadsheets\/d\/([^/]+)/);

      if (docMatch)   return `https://docs.google.com/document/d/${docMatch[1]}/export?format=txt`;
      if (slideMatch) return `https://docs.google.com/presentation/d/${slideMatch[1]}/export?format=txt`;
      if (sheetMatch) return `https://docs.google.com/spreadsheets/d/${sheetMatch[1]}/export?format=tsv`;
    }

    return rawUrl;
  } catch {
    return rawUrl;
  }
}

function extractTextFromHtml(html: string): string {
  const $ = cheerio.load(html);

  // Remove non-content elements
  $("script, style, nav, footer, header, aside, noscript, iframe").remove();

  // Prefer main content areas if present
  const main =
    $("main, article, [role='main'], .content, #content, .post, #main").first();

  const text = (main.length ? main : $("body")).text();

  return text
    .replace(/\t/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    const fetchUrl = resolveUrl(url.trim());

    // Fetch with a browser-like UA to avoid blocks
    const response = await fetch(fetchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
        Accept: "text/html,text/plain,application/xhtml+xml,*/*",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Could not fetch document (HTTP ${response.status}). Make sure the link is publicly accessible.` },
        { status: 400 }
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    let text = "";

    if (contentType.includes("text/html")) {
      const html = await response.text();
      text = extractTextFromHtml(html);
    } else if (contentType.includes("text/plain") || contentType.includes("text/csv") || contentType.includes("text/tab")) {
      text = await response.text();
    } else if (contentType.includes("application/pdf")) {
      return NextResponse.json(
        { error: "PDF files can't be read directly. Open the PDF, copy the text, and paste it into a Google Doc instead — then share that link." },
        { status: 400 }
      );
    } else {
      // Try to read as text anyway
      text = await response.text();
      // If it looks like HTML, parse it
      if (text.trim().startsWith("<")) {
        text = extractTextFromHtml(text);
      }
    }

    if (!text || text.trim().length < 50) {
      return NextResponse.json(
        { error: "Couldn't extract readable text from this URL. Try a different link or paste the content into a Google Doc." },
        { status: 400 }
      );
    }

    // Truncate
    const truncated = text.length > MAX_CHARS
      ? text.slice(0, MAX_CHARS) + "\n\n[Document truncated for length]"
      : text;

    // Derive a readable title from the URL
    const hostname = new URL(fetchUrl).hostname.replace(/^www\./, "");

    return NextResponse.json({
      text: truncated,
      title: hostname,
      charCount: truncated.length,
    });
  } catch (err) {
    console.error("fetch-doc error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.includes("timeout") || msg.includes("abort")) {
      return NextResponse.json({ error: "Request timed out. The page took too long to load." }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to fetch document." }, { status: 500 });
  }
}
