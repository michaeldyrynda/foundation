import matter from "gray-matter";
import { Marked, marked as markedPlain } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import { readFileSync } from "fs";
import type { TaskStatus, ParsedTask } from "../types";

const markedHighlighted = new Marked(
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value;
      }
      return hljs.highlightAuto(code).value;
    },
  })
);

const hasFencedCode = /^```/m;

function renderMarkdown(text: string): string {
  if (hasFencedCode.test(text)) {
    return markedHighlighted.parse(text) as string;
  }
  return markedPlain.parse(text) as string;
}

function normalizeStatus(raw: string): TaskStatus {
  if (raw === "done" || raw === "completed") return "complete";
  return raw as TaskStatus;
}

export function parseTaskContent(
  filePath: string,
  content: string
): ParsedTask {
  const { data, content: body } = matter(content);
  const titleMatch = body.match(/^Title:\s*(.+)$/m);

  const cleaned = body
    .replace(/^Title:\s*.+$/m, "")
    .replace(/^Description:\s*$/m, "## Description")
    .replace(/^Acceptance Criteria:\s*$/m, "## Acceptance Criteria")
    .replace(/^\n+/, "");

  return {
    number: data.number,
    status: normalizeStatus(data.status),
    dependencies: data.dependencies ?? [],
    title: titleMatch?.[1]?.trim() ?? `Task ${data.number}`,
    description: cleaned,
    html: renderMarkdown(cleaned),
    filePath,
  };
}

export function parseTaskFile(filePath: string): ParsedTask {
  const content = readFileSync(filePath, "utf-8");
  return parseTaskContent(filePath, content);
}

export function parseMarkdownFile(filePath: string): {
  content: string;
  html: string;
} {
  const content = readFileSync(filePath, "utf-8");
  return {
    content,
    html: renderMarkdown(content),
  };
}
