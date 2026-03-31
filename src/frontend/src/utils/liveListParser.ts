export interface ParsedAppEntry {
  appName: string;
  usernames: string[];
  importDate?: string;
}

export interface ParseResult {
  success: boolean;
  entries: ParsedAppEntry[];
  errorMessage?: string;
}

export interface PriceEntry {
  appName: string;
  pricePerEntry: number;
  isActive: boolean;
}

export interface PriceParseResult {
  success: boolean;
  entries: PriceEntry[];
  errorMessage?: string;
}

// Old format: *14/02/2026 :-* or *14/02/2026:*
const DATE_LINE_REGEX_OLD = /^\*\s*(\d{1,2}\/\d{1,2}\/\d{2,4})\s*[:\-]*\s*\*$/;

// New format: Share post :- 03/16/26
const DATE_LINE_REGEX_NEW = /^share\s+post\s*:-\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i;

// Old format: *AppName*
const APP_NAME_REGEX_OLD = /^\*([^*]+)\*$/;

// Numbered name line: "1. Name" or "1) Name"
const NUMBERED_LINE_REGEX = /^\d+[.)]\s+(.+)$/;

// Separator lines (3+ dashes, equals, stars)
const SEPARATOR_REGEX = /^[-=_*]{3,}$/;

export function parseLiveListReport(text: string): ParseResult {
  const lines = text.split("\n").map((l) => l.trim());

  const allEntries: ParsedAppEntry[] = [];
  const seen = new Set<string>();

  let currentAppName: string | null = null;
  let currentDate: string | undefined = undefined;
  let currentUsernames: string[] = [];
  // Once an app name is found in "new format" style, lock it
  // so subsequent plain-text lines are not misread as new app names.
  let appNameLocked = false;

  const flushGroup = () => {
    if (currentAppName !== null && currentUsernames.length > 0) {
      allEntries.push({
        appName: currentAppName,
        usernames: [...currentUsernames],
        importDate: currentDate,
      });
    }
    currentUsernames = [];
  };

  for (const line of lines) {
    // Skip blank lines – they MUST NOT stop parsing
    if (!line) continue;

    // Skip visual separator lines
    if (SEPARATOR_REGEX.test(line)) continue;

    // ── 1. Old-format date: *14/02/2026 :-* ──────────────────────────────
    const oldDateMatch = line.match(DATE_LINE_REGEX_OLD);
    if (oldDateMatch) {
      flushGroup();
      currentDate = oldDateMatch[1];
      // Keep currentAppName: multiple dates belong to the same app
      continue;
    }

    // ── 2. New-format date: Share post :- 03/16/26 ───────────────────────
    const newDateMatch = line.match(DATE_LINE_REGEX_NEW);
    if (newDateMatch) {
      flushGroup();
      currentDate = newDateMatch[1];
      continue;
    }

    // ── 3. Old-format app name: *AppName* ────────────────────────────────
    const oldAppMatch = line.match(APP_NAME_REGEX_OLD);
    if (oldAppMatch) {
      flushGroup();
      currentAppName = oldAppMatch[1].trim();
      currentDate = undefined; // reset date for new app block
      appNameLocked = true;
      continue;
    }

    // ── 4. Numbered username line: "1. Name" or "1) Name" ────────────────
    const numberedMatch = line.match(NUMBERED_LINE_REGEX);
    if (numberedMatch) {
      if (currentAppName !== null) {
        const username = numberedMatch[1].trim();
        if (username) {
          const dedupeKey = `${currentAppName}|${username}|${currentDate ?? ""}`;
          if (!seen.has(dedupeKey)) {
            seen.add(dedupeKey);
            currentUsernames.push(username);
          }
        }
      }
      continue;
    }

    // ── 5. Plain non-numbered line (potential app name in new format) ─────
    if (!appNameLocked) {
      // Strip trailing colon / dash suffix: "Reviews world PVT. LTD.:" → "Reviews world PVT. LTD."
      const potentialName = line.replace(/[:\-]+\s*$/, "").trim();
      if (potentialName.length > 0) {
        currentAppName = potentialName;
        appNameLocked = true;
      }
    }
    // If appNameLocked, non-numbered plain lines are section headers or noise – ignore.
  }

  // Flush whatever is left
  flushGroup();

  const validEntries = allEntries.filter((e) => e.appName.length > 0);

  if (validEntries.length === 0) {
    return {
      success: false,
      entries: [],
      errorMessage:
        "No entries detected. Paste data starting with the app name, followed by date lines (Share post :- DD/MM/YY) and numbered names (1. Name). For old format, wrap app names in *asterisks*.",
    };
  }

  return {
    success: true,
    entries: validEntries,
  };
}

/**
 * Parse a bulk price list text in CSV-like format:
 *   AppName, Price, [Active]
 * Returns structured price entries or an error.
 */
export function parsePriceListText(text: string): PriceParseResult {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return {
      success: false,
      entries: [],
      errorMessage: "No data to parse.",
    };
  }

  const entries: PriceEntry[] = [];

  for (const line of lines) {
    const parts = line.split(",").map((p) => p.trim());
    if (parts.length < 2) {
      return {
        success: false,
        entries: [],
        errorMessage: `Invalid line: "${line}". Expected: AppName, Price, [Active]`,
      };
    }
    const appName = parts[0];
    const priceVal = Number.parseFloat(parts[1]);
    const isActive = parts[2] ? parts[2].toLowerCase() !== "false" : true;

    if (!appName || Number.isNaN(priceVal)) {
      return {
        success: false,
        entries: [],
        errorMessage: `Invalid data in line: "${line}"`,
      };
    }

    entries.push({ appName, pricePerEntry: priceVal, isActive });
  }

  return { success: true, entries };
}
