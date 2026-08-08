export const DEFAULT_SUPABASE_PAGE_SIZE = 1000;
const DEFAULT_MAX_PAGES = 10000;

export async function loadPaginatedSupabaseRows({
  sourceName,
  fetchPage,
  pageSize = DEFAULT_SUPABASE_PAGE_SIZE,
  maxPages = DEFAULT_MAX_PAGES,
}) {
  const rows = [];

  for (let pageNumber = 0; pageNumber < maxPages; pageNumber += 1) {
    const from = pageNumber * pageSize;
    const { data, error } = await fetchPage(from, from + pageSize - 1);

    if (error) {
      const message = error.message || String(error);
      throw new Error(`Failed to load Supabase source "${sourceName}": ${message}`, { cause: error });
    }
    if (!Array.isArray(data)) {
      throw new Error(`Failed to load Supabase source "${sourceName}": response was not an array.`);
    }

    rows.push(...data);
    if (data.length < pageSize) return rows;
  }

  throw new Error(`Failed to load Supabase source "${sourceName}": pagination exceeded ${maxPages} pages.`);
}
