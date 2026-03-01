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

// Matches a date line like *14/02/2026 :-* or *14/02/2026:*
const DATE_LINE_REGEX = /^\*\s*(\d{1,2}\/\d{1,2}\/\d{2,4})\s*[:\-]*\s*\*$/;

// Matches an app/event name like *Mstock* or *Docx editor*
const APP_NAME_REGEX = /^\*([^*]+)\*$/;

// Matches a numbered username line like "10. Abhi Aru" or "10) Abhi Aru"
const NUMBERED_LINE_REGEX = /^\d+[\.\)]\s+(.+)$/;

// Matches separator lines
const SEPARATOR_REGEX = /^[-=_*]{3,}$/;

export function parseLiveListReport(text: string): ParseResult {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  const entries: ParsedAppEntry[] = [];
  let currentEntry: ParsedAppEntry | null = null;
  let currentDate: string | undefined = undefined;

  for (const line of lines) {
    // Skip separator lines
    if (SEPARATOR_REGEX.test(line)) continue;

    // Check for date line first (before app name check, since dates are also wrapped in *)
    const dateMatch = line.match(DATE_LINE_REGEX);
    if (dateMatch) {
      currentDate = dateMatch[1];
      // If we have a current entry, update its date
      if (currentEntry) {
        currentEntry.importDate = currentDate;
      }
      continue;
    }

    // Check for app/event name
    const appMatch = line.match(APP_NAME_REGEX);
    if (appMatch) {
      const appName = appMatch[1].trim();
      // Save previous entry if exists
      if (currentEntry) {
        entries.push(currentEntry);
      }
      currentEntry = {
        appName,
        usernames: [],
        importDate: currentDate,
      };
      continue;
    }

    // If we have a current app entry, try to parse as username
    if (currentEntry) {
      // Try to strip numbering
      const numberedMatch = line.match(NUMBERED_LINE_REGEX);
      const username = numberedMatch ? numberedMatch[1].trim() : line.trim();

      if (username) {
        currentEntry.usernames.push(username);
      }
    }
  }

  // Push the last entry
  if (currentEntry) {
    entries.push(currentEntry);
  }

  // Filter out entries with no app name
  const validEntries = entries.filter((e) => e.appName.length > 0);

  if (validEntries.length === 0) {
    return {
      success: false,
      entries: [],
      errorMessage:
        "No app blocks detected. Make sure app names are wrapped in asterisks, e.g. *Mstock*",
    };
  }

  return {
    success: true,
    entries: validEntries,
  };
}
