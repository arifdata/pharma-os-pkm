<script>
  import { onMount } from "svelte";
  import {
    Button,
    DataTable,
    DataTableSkeleton,
    Pagination,
    Tag,
    TagSet,
    Toolbar,
    ToolbarContent,
    ToolbarSearch,
  } from "carbon-components-svelte";
  import { Renew } from "carbon-icons-svelte";

  import { pb } from "../../pb/client.svelte";
  import EmptyState from "../../lib/EmptyState.svelte";
  import ErrorState from "../../lib/ErrorState.svelte";
  import PageShell from "../../lib/PageShell.svelte";
  import { debounce, pageUpdateHandler } from "../../lib/table";

  /** @type {any[]} */
  let rows = $state([]);
  let loading = $state(true);
  let reloading = $state(false);
  let error = $state("");
  let currentPage = $state(1);
  let pageSize = $state(10);
  let totalItems = $state(0);
  let query = $state("");

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

  const handlePageUpdate = pageUpdateHandler(
    () => currentPage,
    (page) => (currentPage = page),
    loadData,
  );

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

  /**
   * @param {string} value
   */
  function onSearch(value) {
    query = value;
    applyQuery();
  }

  onMount(() => loadData().finally(() => (loading = false)));
</script>

<PageShell
  title="Stok Gudang"
  subtitle="Stok aktif per batch beserta tanggal kadaluarsa."
>
  {#if loading}
    <DataTableSkeleton columns={5} rows={5} headers={headers} />
  {:else if error !== ""}
    <ErrorState message="Gagal memuat stok gudang" description={error} onRetry={reload} />
  {:else}
    <DataTable {headers} {rows} zebra size="short">
      <Toolbar>
        <ToolbarContent>
          <ToolbarSearch
            bind:value={query}
            placeholder="Cari nama item"
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
        </ToolbarContent>
      </Toolbar>
      <svelte:fragment slot="cell" let:cell>
        {#if cell.key === "labels" && cell.value !== "-"}
          <TagSet multiline>
            {#each cell.value.split(", ") as label}
              <Tag size="sm" type="outline">{label}</Tag>
            {/each}
          </TagSet>
        {:else if cell.key === "jumlah"}
          <div class="cell-numeric">{cell.value}</div>
        {:else}
          {cell.value}
        {/if}
      </svelte:fragment>
    </DataTable>

    {#if totalItems === 0}
      <EmptyState
        title={query.trim() !== "" ? "Tidak ada hasil" : "Stok masih kosong"}
        description={query.trim() !== ""
          ? "Tidak ada item yang cocok dengan pencarian."
          : "Stok akan terisi setelah ada penerimaan gudang."}
        actionLabel={query.trim() !== "" ? "Hapus pencarian" : ""}
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
