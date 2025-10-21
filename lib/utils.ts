export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

import type { Locale } from "@/lib/i18n";

function resolveLocale(locale: Locale | undefined) {
  switch (locale) {
    case "nl":
      return "nl-NL";
    case "en":
    default:
      return "en-US";
  }
}

export function formatDate(date: Date, locale: Locale = "en") {
  return new Intl.DateTimeFormat(resolveLocale(locale), {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function toDatetimeLocal(date?: Date | null) {
  if (!date) return "";

  const pad = (value: number) => value.toString().padStart(2, "0");

  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  ].join("T");
}

function stripMarkdown(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, " $1 ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/[*_~>#+=-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function generateExcerpt(markdown: string, maxLength = 220) {
  const plain = stripMarkdown(markdown);
  if (!plain) {
    return "";
  }

  if (plain.length <= maxLength) {
    return plain;
  }

  const sentences = plain.match(/[^.!?]+[.!?]+/g) ?? [];
  let excerpt = "";
  for (const sentence of sentences) {
    if ((excerpt + sentence).trim().length > maxLength) {
      break;
    }
    excerpt += `${sentence.trim()} `;
  }

  const result = excerpt.trim();
  if (result) {
    return result.length <= maxLength ? result : `${result.slice(0, maxLength).trim()}…`;
  }

  return `${plain.slice(0, maxLength).trim()}…`;
}
