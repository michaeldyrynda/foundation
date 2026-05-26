import matter from "gray-matter";
import { Marked, marked as markedPlain } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import { readFileSync } from "fs";
import type { TaskStatus, ParsedTask, TaskDescriptionSections } from "../types";

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

function capitalizeFirst(value: string): string {
  const trimmed = value.trim();
  return trimmed ? trimmed[0]!.toUpperCase() + trimmed.slice(1) : trimmed;
}

const structuredDescriptionPattern = /^Description:\s*\n- Role:\s*(.+)\n- Goal:\s*(.+)\n- Entry point:\s*(.+)\n- Product surface:\s*(.+)\n- Completion state:\s*(.+)$/m;

function parseDescriptionSections(body: string): {
  sections?: TaskDescriptionSections;
  content: string;
} {
  const match = body.match(structuredDescriptionPattern);
  if (!match) return { content: body };

  const [block, role, goal, entryPoint, productSurface, completionState] = match;

  return {
    sections: {
      role: role!.trim(),
      goal: capitalizeFirst(goal!),
      entryPoint: capitalizeFirst(entryPoint!),
      productSurface: capitalizeFirst(productSurface!),
      completionState: capitalizeFirst(completionState!),
    },
    content: body.replace(block, ""),
  };
}

export function parseTaskContent(
  filePath: string,
  content: string
): ParsedTask {
  const { data, content: body } = matter(content);
  const titleMatch = body.match(/^Title:\s*(.+)$/m);
  const bodyWithoutTitle = body.replace(/^Title:\s*.+$/m, "");
  const { sections: descriptionSections, content: bodyWithoutStructuredDescription } =
    parseDescriptionSections(bodyWithoutTitle);

  const cleaned = bodyWithoutStructuredDescription
    .replace(/^Description:\s*$/m, "## Description")
    .replace(/^Acceptance Criteria:\s*$/m, "## Acceptance Criteria")
    .replace(/^\n+/, "");

  return {
    number: data.number,
    status: normalizeStatus(data.status),
    dependencies: data.dependencies ?? [],
    title: titleMatch?.[1]?.trim() ?? `Task ${data.number}`,
    description: cleaned,
    descriptionSections,
    html: renderMarkdown(cleaned),
    filePath,
    soloTodoId: data.solo_todo_id ?? null,
    soloUrl: data.solo_slug ?? null,
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
  const { content: body } = matter(content);
  return {
    content: body,
    html: renderMarkdown(body),
  };
}

export function parseSpecFrontmatter(filePath: string): Record<string, unknown> {
  const content = readFileSync(filePath, "utf-8");
  const { data } = matter(content);
  return data;
}
