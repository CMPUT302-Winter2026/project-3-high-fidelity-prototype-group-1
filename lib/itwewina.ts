import type { ImportWordPayload, MeaningInput } from "@/types";
import { emptyToUndefined, slugify, uniqueBy } from "@/lib/utils";

const ITWEWINA_BASE_URL = "https://itwewina.altlab.app";
const SEARCH_RESULT_ARTICLE_PATTERN =
  /<article class="definition box box--rounded" data-cy="search-result">([\s\S]*?)<\/article>/g;
const MEANING_ITEM_PATTERN = /<li class="meanings__meaning" data-cy="lemma-meaning">([\s\S]*?)<\/li>/g;
const DATA_ITEM_PATTERN = /<data(?:\s+value="([^"]*)")?>([\s\S]*?)<\/data>/g;
const BULK_AUDIO_CHUNK_SIZE = 25;
const SPEECH_DB_VARIANTS = ["maskwacis", "moswacihk"] as const;

type SpeechDbVariant = (typeof SPEECH_DB_VARIANTS)[number];

type ItwewinaBreakdownItem = {
  codes: string[];
  text: string;
};

type ItwewinaSearchEntry = {
  lemma: string;
  syllabics?: string;
  partOfSpeech: string;
  linguisticClass?: string;
  rootStem?: string;
  meanings: string[];
  wordUrl: string;
  sourceQuery: string;
  audioUrl?: string;
};

type SpeechDbResponse = {
  matched_recordings?: Array<{
    wordform?: string;
    recording_url?: string;
    is_best?: boolean;
  }>;
};

function decodeHtmlEntities(value: string) {
  const decodedNamed = value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/gi, "'");

  return decodedNamed
    .replace(/&#(\d+);/g, (_, codePoint) => String.fromCodePoint(Number(codePoint)))
    .replace(/&#x([a-f0-9]+);/gi, (_, codePoint) => String.fromCodePoint(parseInt(codePoint, 16)));
}

function collapseWhitespace(value: string) {
  return decodeHtmlEntities(value).replace(/\s+/g, " ").trim();
}

function stripTags(value: string) {
  return collapseWhitespace(value.replace(/<[^>]+>/g, " "));
}

function parseAttributes(tag: string) {
  const attributes: Record<string, string> = {};
  const attributePattern = /([^\s=/>]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;

  for (const match of tag.matchAll(attributePattern)) {
    const name = match[1];
    if (!name || name.startsWith("<")) {
      continue;
    }

    attributes[name] = match[2] ?? match[3] ?? match[4] ?? "";
  }

  return attributes;
}

function extractMeanings(articleHtml: string) {
  const meanings: string[] = [];

  for (const match of articleHtml.matchAll(MEANING_ITEM_PATTERN)) {
    const firstText = match[1]?.match(/^\s*([^<]+)/)?.[1];
    const gloss = collapseWhitespace(firstText ?? "");

    if (gloss) {
      meanings.push(gloss);
    }
  }

  return uniqueBy(meanings, (meaning) => meaning.toLowerCase());
}

function parseBreakdownCodes(rawValue?: string) {
  if (!rawValue) {
    return [];
  }

  const decoded = decodeHtmlEntities(rawValue);
  const quoted = Array.from(decoded.matchAll(/['"]([^'"]+)['"]/g), (match) => match[1]?.trim()).filter(
    (value): value is string => Boolean(value)
  );

  if (quoted.length > 0) {
    return quoted;
  }

  return decoded
    .replace(/[[\]]/g, "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function extractBreakdown(articleHtml: string) {
  const breakdownHtml = articleHtml.match(/<div[^>]*data-cy="linguistic-breakdown"[^>]*>([\s\S]*?)<\/div>/)?.[1];

  if (!breakdownHtml) {
    return [];
  }

  const items: ItwewinaBreakdownItem[] = [];

  for (const match of breakdownHtml.matchAll(DATA_ITEM_PATTERN)) {
    const text = stripTags(match[2] ?? "");
    if (!text) {
      continue;
    }

    items.push({
      codes: parseBreakdownCodes(match[1]),
      text
    });
  }

  return items;
}

function formatLinguisticClass(items: ItwewinaBreakdownItem[]) {
  const label = items
    .map((item) => {
      const summary = item.text.split("—")[0]?.trim() ?? item.text;
      return item.codes.length > 0 ? `${item.codes.join("/")}: ${summary}` : summary;
    })
    .join(" | ");

  return emptyToUndefined(label);
}

function buildNotes(entry: ItwewinaSearchEntry) {
  const details = [
    `Imported from ${entry.wordUrl}`,
    `Search query: ${entry.sourceQuery}`
  ];

  if (entry.linguisticClass) {
    details.push(`Breakdown: ${entry.linguisticClass}`);
  }

  if (entry.rootStem) {
    details.push(`Stem: ${entry.rootStem}`);
  }

  return details.join(" | ");
}

function mapEntryToImportWord(entry: ItwewinaSearchEntry): ImportWordPayload {
  const meanings: MeaningInput[] = entry.meanings.map((gloss, index) => ({
    gloss,
    description: index === 0 ? "Primary gloss from itwewina search" : "",
    sortOrder: index
  }));

  return {
    lemma: entry.lemma,
    syllabics: entry.syllabics ?? "",
    plainEnglish: entry.meanings[0] ?? entry.sourceQuery,
    partOfSpeech: entry.partOfSpeech,
    linguisticClass: entry.linguisticClass ?? "",
    rootStem: entry.rootStem ?? "",
    pronunciation: "",
    audioUrl: entry.audioUrl ?? "",
    source: entry.wordUrl,
    notes: buildNotes(entry),
    beginnerExplanation: "",
    expertExplanation: "",
    categoryIds: [],
    meanings,
    morphologyTables: [],
    relations: [],
    isDemo: false
  };
}

function mergeEntries(entries: ItwewinaSearchEntry[]) {
  const merged = new Map<string, ItwewinaSearchEntry>();

  for (const entry of entries) {
    const key = slugify(entry.lemma);
    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, {
        ...entry,
        meanings: [...entry.meanings]
      });
      continue;
    }

    existing.meanings = uniqueBy([...existing.meanings, ...entry.meanings], (meaning) => meaning.toLowerCase());
    existing.sourceQuery = uniqueBy(
      [existing.sourceQuery, entry.sourceQuery].flatMap((value) => value.split(" | ")),
      (value) => value.toLowerCase()
    ).join(" | ");
    existing.audioUrl = existing.audioUrl ?? entry.audioUrl;
    existing.linguisticClass = existing.linguisticClass ?? entry.linguisticClass;
    existing.rootStem = existing.rootStem ?? entry.rootStem;
  }

  return Array.from(merged.values());
}

function normalizeWordformKey(value: string) {
  return collapseWhitespace(value).toLowerCase().normalize("NFKD");
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function buildSpeechDbUrl(variant: SpeechDbVariant, lemmas: string[]) {
  const url = new URL(`${variant}/api/bulk_search`, "https://speech-db.altlab.app/");

  lemmas.forEach((lemma) => {
    url.searchParams.append("q", lemma);
    url.searchParams.append("exact", "true");
  });

  return url;
}

async function fetchSpeechDbAudioByLemma(lemmas: string[]) {
  const audioByLemma = new Map<string, string>();

  for (const chunk of chunkArray(lemmas, BULK_AUDIO_CHUNK_SIZE)) {
    for (const variant of SPEECH_DB_VARIANTS) {
      try {
        const response = await fetch(buildSpeechDbUrl(variant, chunk), {
          cache: "no-store"
        });

        if (!response.ok) {
          continue;
        }

        const payload = (await response.json()) as SpeechDbResponse;
        const recordings = payload.matched_recordings ?? [];

        recordings
          .sort((left, right) => Number(Boolean(right.is_best)) - Number(Boolean(left.is_best)))
          .forEach((recording) => {
            const wordform = recording.wordform ? normalizeWordformKey(recording.wordform) : "";
            const recordingUrl = recording.recording_url?.replace(/^http:\/\//, "https://");

            if (!wordform || !recordingUrl || audioByLemma.has(wordform)) {
              return;
            }

            audioByLemma.set(wordform, recordingUrl);
          });
      } catch {
        continue;
      }
    }
  }

  return audioByLemma;
}

async function enrichEntriesWithAudio(entries: ItwewinaSearchEntry[]) {
  const uniqueLemmas = uniqueBy(entries.map((entry) => entry.lemma), (lemma) => normalizeWordformKey(lemma));
  const audioByLemma = await fetchSpeechDbAudioByLemma(uniqueLemmas);

  return entries.map((entry) => ({
    ...entry,
    audioUrl: audioByLemma.get(normalizeWordformKey(entry.lemma)) ?? entry.audioUrl
  }));
}

function parseSearchResultArticle(articleHtml: string, sourceQuery: string): ItwewinaSearchEntry | null {
  const lemmaLinkMatch = articleHtml.match(/<a[^>]*data-cy="lemma-link"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
  const spanTagMatch = lemmaLinkMatch?.[2]?.match(/<span[^>]*data-orth[^>]*>/);

  if (!lemmaLinkMatch || !spanTagMatch) {
    return null;
  }

  const spanAttributes = parseAttributes(spanTagMatch[0]);
  const lemma = stripTags(lemmaLinkMatch[2] ?? "");
  const meanings = extractMeanings(articleHtml);
  const breakdown = extractBreakdown(articleHtml);
  const rootStem = collapseWhitespace(
    articleHtml.match(/<h3 class="linguistic-breakdown__stem">\s*([\s\S]*?)\s*<\/h3>/)?.[1] ?? ""
  );

  if (!lemma || meanings.length === 0) {
    return null;
  }

  return {
    lemma,
    syllabics: emptyToUndefined(spanAttributes["data-orth-Cans"]),
    partOfSpeech: breakdown[0]?.text.split("—")[0]?.trim() || "Dictionary entry",
    linguisticClass: formatLinguisticClass(breakdown),
    rootStem: emptyToUndefined(rootStem),
    meanings,
    wordUrl: new URL(lemmaLinkMatch[1], ITWEWINA_BASE_URL).toString(),
    sourceQuery
  };
}

export function parseItwewinaSearchHtml(html: string, sourceQuery: string) {
  const entries = Array.from(html.matchAll(SEARCH_RESULT_ARTICLE_PATTERN), (match) =>
    parseSearchResultArticle(match[1] ?? "", sourceQuery)
  ).filter((entry): entry is ItwewinaSearchEntry => Boolean(entry));

  return mergeEntries(entries);
}

async function fetchItwewinaSearchHtml(query: string) {
  const url = new URL("/search", ITWEWINA_BASE_URL);
  url.searchParams.set("q", query);

  const response = await fetch(url, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`itwewina search failed for "${query}" (${response.status})`);
  }

  return response.text();
}

function parseSearchTerms(rawText: string) {
  return uniqueBy(
    rawText
      .split(/\r?\n/)
      .map((value) => value.trim())
      .filter(Boolean),
    (value) => value.toLowerCase()
  );
}

export async function buildItwewinaImportBatch(rawText: string) {
  const searchTerms = parseSearchTerms(rawText);

  if (searchTerms.length === 0) {
    throw new Error("Add at least one itwewina search term.");
  }

  const fetchedEntries = (
    await Promise.all(
      searchTerms.map(async (term) => {
        const html = await fetchItwewinaSearchHtml(term);
        return parseItwewinaSearchHtml(html, term);
      })
    )
  ).flat();

  const entries = await enrichEntriesWithAudio(mergeEntries(fetchedEntries));

  return {
    queryCount: searchTerms.length,
    words: entries.map(mapEntryToImportWord)
  };
}
