import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import type { RelationTypeValue } from "@/types";

const ASCII_MAP: Record<string, string> = {
  â: "a",
  ê: "e",
  î: "i",
  ô: "o",
  ā: "a",
  ē: "e",
  ī: "i",
  ō: "o",
  ý: "y",
  Â: "a",
  Ê: "e",
  Î: "i",
  Ô: "o",
  Ā: "a",
  Ē: "e",
  Ī: "i",
  Ō: "o",
  Ý: "y"
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(value: string) {
  const ascii = value
    .split("")
    .map((character) => ASCII_MAP[character] ?? character)
    .join("");

  return ascii
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function emptyToUndefined(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function normalizeLineBreaks(value?: string | null) {
  return value?.replace(/\r\n/g, "\n").trim() ?? "";
}

export function uniqueBy<T>(items: T[], getKey: (item: T) => string) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = getKey(item);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function sortBySortOrder<T extends { sortOrder?: number }>(items: T[]) {
  return [...items].sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0));
}

export function getInverseRelationType(type: RelationTypeValue): RelationTypeValue {
  switch (type) {
    case "broader":
      return "narrower";
    case "narrower":
      return "broader";
    default:
      return type;
  }
}

export function formatRelationLabel(type: RelationTypeValue) {
  switch (type) {
    case "categoryMember":
      return "Theme";
    case "broader":
      return "Broader";
    case "narrower":
      return "Narrower";
    case "associated":
      return "Associated";
    case "similar":
      return "Similar";
    case "variant":
      return "Variant";
    case "antonym":
      return "Antonym";
    case "synonym":
    default:
      return "Synonym";
  }
}

export function titleCase(value: string) {
  return value.replace(/(^|\s)\S/g, (match) => match.toUpperCase());
}

export function toBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y"].includes(normalized)) {
      return true;
    }

    if (["false", "0", "no", "n"].includes(normalized)) {
      return false;
    }
  }

  return fallback;
}

export function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
