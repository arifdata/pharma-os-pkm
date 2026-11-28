/** Payload of Carbon `Pagination` `update` event. */
export type PageUpdate = CustomEvent<{ page: number; pageSize: number }>;

/**
 * Carbon `Pagination` memancarkan `update` saat pengguna mengganti halaman atau
 * ukuran halaman, tetapi tidak saat `page` direset secara programatik. Karena
 * itu handler ini juga memicu pemuatan data setelah mereset halaman ke 1 saat
 * `pageSize` berubah.
 *
 * @param getPage halaman aktif saat ini
 * @param setPage setter halaman (biasanya `(p) => (currentPage = p)`)
 * @param load pemuat data satu halaman
 */
export function pageUpdateHandler(
  getPage: () => number,
  setPage: (page: number) => void,
  load: () => void,
): (event: PageUpdate) => void {
  let appliedPageSize: number | undefined;

  return (event) => {
    const { pageSize } = event.detail;
    if (appliedPageSize === undefined) appliedPageSize = pageSize;
    if (pageSize !== appliedPageSize) {
      appliedPageSize = pageSize;
      // Carbon tidak memancarkan `update` untuk perubahan `page` programatik,
      // jadi reset halaman dilakukan di sini dan pemuatan tetap satu kali.
      if (getPage() !== 1) setPage(1);
    }
    load();
  };
}

/**
 * Debounce yang menyimpan argumen terakhir.
 * @param fn fungsi yang di-debounce
 * @param wait jeda dalam milidetik
 */
export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  wait = 300,
): (...args: A) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

/**
 * Nilai `sort` PocketBase untuk state sorting tabel.
 *
 * Kolom yang tidak bisa diurutkan (mis. `actions`) memakai `sort: false`, dan
 * klik ketiga pada header menghasilkan `none` — keduanya jatuh ke `fallback`.
 *
 * @param key kolom aktif (`null` = tanpa sorting)
 * @param direction arah sorting
 * @param fallback sorting default koleksi
 */
export function sortParam(
  key: string | null | undefined,
  direction: "ascending" | "descending" | "none",
  fallback: string,
): string {
  if (key === null || key === undefined || direction === "none") return fallback;
  return `${direction === "descending" ? "-" : ""}${key}`;
}
