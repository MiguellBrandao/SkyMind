import * as cheerio from "cheerio";

export interface CleanedDocument {
  title: string;
  content: string;
}

const NOISE_SELECTORS = [
  "script",
  "style",
  "noscript",
  ".navbox",
  ".toc",
  ".mw-editsection",
  ".reference",
  "sup.reference",
  "#catlinks",
  ".mw-indicators",
  ".printfooter",
  ".mw-jump-link",
  "table.ambox",
  ".hatnote",
];

/** Extracts clean article text from a MediaWiki-rendered page (wiki.hypixel.net), stripping navigation/edit-link noise. */
export function cleanMediaWikiHtml(html: string): CleanedDocument {
  const $ = cheerio.load(html);
  const title = $("#firstHeading").first().text().trim() || $("title").first().text().trim() || "Untitled";

  const parserOutput = $(".mw-parser-output").first();
  const container = parserOutput.length > 0 ? parserOutput : $("body");

  for (const selector of NOISE_SELECTORS) {
    container.find(selector).remove();
  }

  const lines: string[] = [];
  container.find("h2, h3, h4, p, li").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text.length > 0) lines.push(text);
  });

  return { title, content: lines.join("\n") };
}
