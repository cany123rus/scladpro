/**
 * Все строки запроса, страницами.
 *
 * База отдаёт за один запрос не больше тысячи строк, и `.limit(10000)` этого не
 * меняет: у кабинета с 1019 карточками хвост молча терялся. Здесь запрос
 * повторяется со сдвигом, пока страница приходит полной. У запроса должна быть
 * стабильная сортировка (`.order(...)`), иначе строки между страницами
 * перемешаются.
 */
export async function fetchAllPages<T = any>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>,
  pageSize = 1000,
  maxRows = 100_000,
): Promise<{ data: T[]; error: any }> {
  const all: T[] = [];
  for (let from = 0; from < maxRows; from += pageSize) {
    const { data, error } = await build(from, from + pageSize - 1);
    if (error) return { data: all, error };
    const page = data || [];
    all.push(...page);
    if (page.length < pageSize) break;
  }
  return { data: all, error: null };
}
