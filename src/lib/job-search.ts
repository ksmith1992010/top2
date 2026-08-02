export const MAX_JOB_SEARCH_LENGTH = 100;

/** Trim and cap job list search input. Empty after trim means no search. */
export function normalizeJobSearch(search: string | undefined): string | undefined {
  if (search == null) {
    return undefined;
  }

  const trimmed = search.trim().slice(0, MAX_JOB_SEARCH_LENGTH);
  return trimmed.length > 0 ? trimmed : undefined;
}
