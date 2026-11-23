<script>
  import { onMount } from "svelte";
  import {
    Button,
    DataTable,
    DataTableSkeleton,
    Toolbar,
    ToolbarContent,
    Pagination,
  } from "carbon-components-svelte";
  import { Add, Renew } from "carbon-icons-svelte";

  import { pb } from "../../../pb/client.svelte";

  /** @type {any[]} */
  let rows = $state([]);
  let loading = $state(true);
  let reloading = $state(false);
  let error = $state("");
  let currentPage = $state(1);
  let pageSize = $state(10);
  let totalItems = $state(0);

  const headers = [
    { key: "tanggal_terima", value: "Tanggal Terima", width: "20%" },
    { key: "nomor_surat", value: "Nomor Surat", width: "50%" },
    { key: "sumber", value: "Sumber" },
  ];

  /**
   * Ambil satu halaman data, terbaru berdasarkan tanggal_terima.
   */
  async function loadData() {
    try {
      const result = await pb.collection("penerimaan_gudang").getList(currentPage, pageSize, {
        sort: "-tanggal_terima",
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

  /** @type {number | undefined} */
  let appliedPageSize;

  /**
   * Pagination memancarkan `update` saat page/pageSize berubah.
   * @param {CustomEvent<{ page: number, pageSize: number }>} event
   */
  function handlePageUpdate(event) {
    if (appliedPageSize === undefined) appliedPageSize = event.detail.pageSize;
    if (event.detail.pageSize !== appliedPageSize) {
      appliedPageSize = event.detail.pageSize;
      if (currentPage !== 1) {
        // reset ke halaman 1; event `update` berikutnya yang memuat data
        currentPage = 1;
        return;
      }
    }
    loadData();
  }

  onMount(() => loadData().finally(() => (loading = false)));
</script>

{#if loading}
  <DataTableSkeleton columns={3} rows={5} headers={headers} />
{:else if error !== ""}
  <p class="error">{error}</p>
{:else}
  <DataTable title="Penerimaan Gudang" size="short" {headers} {rows}>
    <Toolbar>
      <ToolbarContent>
        <Button
          icon={Renew}
          iconDescription="Reload Data"
          tooltipPosition="top"
          disabled={reloading}
          on:click={reload}
        />
        <Button size="small" icon={Add} href="#/penerimaan_gudang/add">
          Tambah Penerimaan
        </Button>
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
  <Pagination
    bind:page={currentPage}
    bind:pageSize
    {totalItems}
    pageSizes={[10, 20, 50]}
    size="sm"
    on:update={handlePageUpdate}
  />
{/if}

<style>
  .error {
    color: var(--cds-text-error, #da1e28);
    padding: 1rem;
  }

  .detail-link {
    color: var(--cds-link-primary, #0f62fe);
    text-decoration: none;
  }

  .detail-link:hover {
    text-decoration: underline;
  }
</style>
