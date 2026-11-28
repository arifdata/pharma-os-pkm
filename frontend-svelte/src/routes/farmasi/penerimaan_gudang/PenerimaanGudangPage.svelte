<script>
  import { onMount } from "svelte";
  import {
    Button,
    DataTable,
    DataTableSkeleton,
    Pagination,
    Toolbar,
    ToolbarContent,
    ToolbarSearch,
  } from "carbon-components-svelte";
  import { Add, Renew } from "carbon-icons-svelte";

  import { pb } from "../../../pb/client.svelte";
  import EmptyState from "../../../lib/EmptyState.svelte";
  import ErrorState from "../../../lib/ErrorState.svelte";
  import PageShell from "../../../lib/PageShell.svelte";
  import { debounce, pageUpdateHandler, sortParam } from "../../../lib/table";

  /** @type {any[]} */
  let rows = $state([]);
  let loading = $state(true);
  let reloading = $state(false);
  let error = $state("");
  let currentPage = $state(1);
  let pageSize = $state(10);
  let totalItems = $state(0);
  let query = $state("");
  /** @type {string | undefined} */
  let sortKey = $state("tanggal_terima");
  /** @type {"ascending" | "descending" | "none"} */
  let sortDirection = $state("descending");

  const headers = [
    { key: "tanggal_terima", value: "Tanggal Terima", width: "20%" },
    { key: "nomor_surat", value: "Nomor Surat", width: "50%" },
    { key: "sumber", value: "Sumber" },
  ];

  const DEFAULT_SORT = "-tanggal_terima";

  /**
   * Ambil satu halaman data (pagination, pencarian, dan sorting server-side).
   */
  async function loadData() {
    const filters = [];
    /** @type {Record<string, string>} */
    const params = {};
    const q = query.trim();
    if (q !== "") {
      filters.push("(nomor_surat ~ {:q} || sumber ~ {:q})");
      params.q = q;
    }
    try {
      const result = await pb.collection("penerimaan_gudang").getList(currentPage, pageSize, {
        filter: filters.length > 0 ? pb.filter(filters.join(" && "), params) : "",
        sort: sortParam(sortKey, sortDirection, DEFAULT_SORT),
      });
      totalItems = result.totalItems;
      rows = result.items.map((/** @type {any} */ r) => ({
        id: r.id,
        tanggal_terima: formatDate(r.tanggal_terima),
        nomor_surat: r.nomor_surat || "-",
        sumber: r.sumber || "-",
      }));
      error = "";
    } catch (e) {
      error = /** @type {Error} */ (e).message ?? "Gagal memuat data";
    }
  }

  /**
   * @param {string} value
   * @returns {string}
   */
  function formatDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  async function reload() {
    reloading = true;
    await loadData();
    reloading = false;
  }

  const handlePageUpdate = pageUpdateHandler(
    () => currentPage,
    (page) => (currentPage = page),
    loadData,
  );

  /**
   * Sorting dikerjakan server-side; `preventDefault` mencegah DataTable
   * mengurutkan hanya halaman aktif (yang urutannya bisa berbeda).
   *
   * @param {CustomEvent<{ key: string | null, direction: "ascending" | "descending" | "none" }>} event
   */
  function onSort(event) {
    event.preventDefault();
    sortKey = event.detail.key ?? "tanggal_terima";
    sortDirection = event.detail.direction;
    reloadFromFirstPage();
  }

  /**
   * Reset ke halaman 1 lalu muat ulang. Carbon `Pagination` tidak memancarkan
   * `update` untuk perubahan `page` programatik, jadi `loadData` dipanggil
   * langsung di sini.
   */
  function reloadFromFirstPage() {
    currentPage = 1;
    loadData();
  }

  const applyQuery = debounce(reloadFromFirstPage);

  /** @param {string} value */
  function onSearch(value) {
    query = value;
    applyQuery();
  }

  onMount(() => loadData().finally(() => (loading = false)));
</script>

<PageShell
  title="Penerimaan Gudang"
  subtitle="Daftar penerimaan barang yang masuk ke gudang."
>
  {#if loading}
    <DataTableSkeleton columns={3} rows={5} headers={headers} />
  {:else if error !== ""}
    <ErrorState message="Gagal memuat penerimaan gudang" description={error} onRetry={reload} />
  {:else}
    <DataTable
      {headers}
      {rows}
      zebra
      size="short"
      sortable
      bind:sortKey
      bind:sortDirection
      on:sort={onSort}
    >
      <Toolbar>
        <ToolbarContent>
          <ToolbarSearch
            bind:value={query}
            placeholder="Cari nomor surat atau sumber"
            on:input={(/** @type {any} */ e) => onSearch(e.target?.value ?? "")}
            on:clear={() => onSearch("")}
            persistent
          />
          <Button
            icon={Renew}
            iconDescription="Reload Data"
            tooltipPosition="top"
            disabled={reloading}
            on:click={reload}
          />
          <Button
            icon={Add}
            iconDescription="Tambah Penerimaan"
            tooltipPosition="top"
            href="#/penerimaan_gudang/add"
          />
        </ToolbarContent>
      </Toolbar>
      <svelte:fragment slot="cell" let:row let:cell>
        {#if cell.key === "nomor_surat"}
          <a
            class="detail-link"
            href="#/penerimaan_gudang/{row.id}"
            target="_blank"
            rel="noopener noreferrer"
            title="Buka detail item penerimaan"
          >
            {cell.value}
          </a>
        {:else}
          {cell.value}
        {/if}
      </svelte:fragment>
    </DataTable>

    {#if totalItems === 0}
      <EmptyState
        title={query.trim() !== "" ? "Tidak ada hasil" : "Belum ada penerimaan"}
        description={query.trim() !== ""
          ? "Tidak ada penerimaan yang cocok dengan pencarian."
          : "Data penerimaan yang masuk ke gudang akan tampil di sini."}
        actionLabel={query.trim() !== "" ? "Hapus pencarian" : "Tambah Penerimaan"}
        actionHref={query.trim() !== "" ? "" : "#/penerimaan_gudang/add"}
        onAction={() => onSearch("")}
      />
    {:else}
      <Pagination
        bind:page={currentPage}
        bind:pageSize
        {totalItems}
        pageSizes={[10, 20, 50]}
        size="sm"
        on:update={handlePageUpdate}
      />
    {/if}
  {/if}
</PageShell>

<style>
  .detail-link {
    color: var(--cds-link-primary, #0f62fe);
    text-decoration: none;
  }

  .detail-link:hover {
    text-decoration: underline;
  }
</style>
