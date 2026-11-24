<script>
  import { onMount } from "svelte";
  import {
    Button,
    DataTable,
    DataTableSkeleton,
    Pagination,
    Search,
    Tag,
    TagSet,
    Toolbar,
    ToolbarContent,
  } from "carbon-components-svelte";
  import { Renew } from "carbon-icons-svelte";

  import { pb } from "../../pb/client.svelte";

  /** @type {any[]} */
  let rows = $state([]);
  let loading = $state(true);
  let reloading = $state(false);
  let error = $state("");
  let currentPage = $state(1);
  let pageSize = $state(10);
  let totalItems = $state(0);
  let query = $state("");
  /** @type {ReturnType<typeof setTimeout>|undefined} */
  let queryDebounce;

  const headers = [
    { key: "nama_bmhp", value: "Nama Item", width: "30%" },
    { key: "jumlah", value: "Jumlah" },
    { key: "tanggal_expired", value: "Tgl Kadaluarsa" },
    { key: "no_batch", value: "Nomor Batch" },
    { key: "labels", value: "Label" },
  ];

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

  /**
   * Hanya stok aktif yang ditampilkan; `query` mencari nama item (server-side).
   */
  async function loadData() {
    const filters = ["is_active = true"];
    /** @type {Record<string, string>} */
    const params = {};
    const q = query.trim();
    if (q !== "") {
      filters.push("item.nama_bmhp.nama_bmhp ~ {:q}");
      params.q = q;
    }
    try {
      const result = await pb.collection("stok_gudang").getList(currentPage, pageSize, {
        filter: pb.filter(filters.join(" && "), params),
        expand: "item,item.nama_bmhp,item.labels",
        sort: "created",
      });
      totalItems = result.totalItems;
      rows = result.items.map((/** @type {any} */ r) => {
        const item = r.expand?.["item"];
        return {
          id: r.id,
          nama_bmhp: item?.expand?.["nama_bmhp"]?.["nama_bmhp"] ?? "-",
          jumlah: r["jumlah"] ?? 0,
          tanggal_expired: formatDate(item?.["tanggal_expired"]),
          no_batch: item?.["no_batch"] || "-",
          labels: (item?.expand?.["labels"] ?? [])
            .map((/** @type {any} */ l) => l["label"])
            .join(", ") || "-",
        };
      });
      error = "";
    } catch (e) {
      error = /** @type {Error} */ (e).message ?? "Gagal memuat data";
    }
  }

  async function reload() {
    reloading = true;
    await loadData();
    reloading = false;
  }

  /**
   * @param {string} value
   */
  function onSearch(value) {
    query = value;
    clearTimeout(queryDebounce);
    queryDebounce = setTimeout(() => {
      // hasil pencarian selalu mulai dari halaman 1
      if (currentPage !== 1) {
        currentPage = 1;
        return;
      }
      loadData();
    }, 300);
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
  <DataTableSkeleton columns={5} rows={5} headers={headers} />
{:else if error !== ""}
  <p class="error">{error}</p>
{:else}
  <DataTable title="Stok Gudang" {headers} {rows} zebra>
    <Toolbar>
      <ToolbarContent>
        <Search
          size="sm"
          placeholder="Cari nama item..."
          bind:value={query}
          on:input={(/** @type {any} */ e) => onSearch(e.target?.value ?? "")}
          on:clear={() => onSearch("")}
        />
        <Button
          icon={Renew}
          iconDescription="Reload Data"
          tooltipPosition="top"
          disabled={reloading}
          on:click={reload}
        />
      </ToolbarContent>
    </Toolbar>
    <svelte:fragment slot="cell" let:cell>
      {#if cell.key === "labels" && cell.value !== "-"}
        <TagSet multiline>
          {#each cell.value.split(", ") as label}
            <Tag size="sm" type="outline">{label}</Tag>
          {/each}
        </TagSet>
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
</style>
