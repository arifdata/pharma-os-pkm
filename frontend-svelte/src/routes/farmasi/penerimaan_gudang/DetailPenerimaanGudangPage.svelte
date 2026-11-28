<script>
  import {
    Button,
    DataTable,
    DataTableSkeleton,
    Pagination,
    Tag,
    TagSet,
    Toolbar,
    ToolbarContent,
  } from "carbon-components-svelte";
  import { Renew } from "carbon-icons-svelte";

  import { pb } from "../../../pb/client.svelte";
  import EmptyState from "../../../lib/EmptyState.svelte";
  import ErrorState from "../../../lib/ErrorState.svelte";
  import PageShell from "../../../lib/PageShell.svelte";
  import { pageUpdateHandler } from "../../../lib/table";

  let { params = {} } = $props();

  const id = $derived(String(params["id"] ?? ""));

  /** @type {{tanggal_terima:string,nomor_surat:string,sumber:string}|null} */
  let header = $state(null);
  /** @type {any[]} */
  let rows = $state([]);
  let loading = $state(true);
  let reloading = $state(false);
  let error = $state("");
  let currentPage = $state(1);
  let pageSize = $state(10);
  let totalItems = $state(0);

  const headers = [
    { key: "nama_bmhp", value: "Nama BMHP", width: "30%" },
    { key: "jumlah", value: "Jumlah" },
    { key: "no_batch", value: "No. Batch" },
    { key: "tanggal_expired", value: "Tanggal Expired" },
    { key: "harga_satuan", value: "Harga Satuan" },
    { key: "labels", value: "Labels" },
  ];

  const rupiah = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });

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

  async function loadData() {
    if (id === "") {
      error = "ID penerimaan gudang tidak valid";
      rows = [];
      return;
    }
    try {
      const record = await pb.collection("penerimaan_gudang").getOne(id);
      header = {
        tanggal_terima: formatDate(record["tanggal_terima"]),
        nomor_surat: record["nomor_surat"] || "-",
        sumber: record["sumber"] || "-",
      };

      const result = await pb.collection("penerimaan_gudang_items").getList(currentPage, pageSize, {
        filter: pb.filter("penerimaan_gudang = {:id}", { id }),
        expand: "nama_bmhp,labels",
        sort: "created",
      });

      totalItems = result.totalItems;
      rows = result.items.map((/** @type {any} */ r) => ({
        id: r.id,
        nama_bmhp: r.expand?.["nama_bmhp"]?.["nama_bmhp"] ?? "-",
        jumlah: r["jumlah"] ?? 0,
        no_batch: r["no_batch"] || "-",
        tanggal_expired: formatDate(r["tanggal_expired"]),
        harga_satuan: rupiah.format(r["harga_satuan"] ?? 0),
        labels: (r.expand?.["labels"] ?? [])
          .map((/** @type {any} */ l) => l["label"])
          .join(", ") || "-",
      }));
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

  $effect(() => {
    const currentId = id;
    if (currentId === "") {
      loading = false;
      return;
    }
    currentPage = 1;
    loading = true;
    loadData().finally(() => (loading = false));
  });
</script>

<PageShell
  title="Detail Penerimaan Gudang"
  subtitle="Rincian item pada satu surat penerimaan."
  backHref="#/penerimaan_gudang"
  backLabel="Kembali ke daftar penerimaan"
>
  {#if loading}
    <DataTableSkeleton columns={6} rows={5} headers={headers} />
  {:else if error !== ""}
    <ErrorState message="Gagal memuat detail penerimaan" description={error} onRetry={reload} />
  {:else}
    <div class="header-grid">
      <div>
        <div class="label">Nomor Surat</div>
        <div class="value">{header?.nomor_surat ?? "-"}</div>
      </div>
      <div>
        <div class="label">Tanggal Terima</div>
        <div class="value">{header?.tanggal_terima ?? "-"}</div>
      </div>
      <div>
        <div class="label">Sumber</div>
        <div class="value">{header?.sumber ?? "-"}</div>
      </div>
      <div>
        <div class="label">Jumlah Item</div>
        <div class="value">{totalItems}</div>
      </div>
    </div>

    <DataTable {headers} {rows} zebra size="short">
      <Toolbar>
        <ToolbarContent>
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
        {:else if cell.key === "jumlah" || cell.key === "harga_satuan"}
          <div class="cell-numeric">{cell.value}</div>
        {:else}
          {cell.value}
        {/if}
      </svelte:fragment>
    </DataTable>

    {#if totalItems === 0}
      <EmptyState
        title="Belum ada item"
        description="Penerimaan ini belum memiliki item yang tercatat."
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
  .header-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
    gap: 1rem;
    padding: 1rem;
    margin-bottom: 1rem;
    background: var(--cds-layer, #f4f4f4);
  }

  .header-grid .label {
    font-size: 0.75rem;
    line-height: 1rem;
    letter-spacing: 0.32px;
    color: var(--cds-text-secondary, #525252);
    margin-bottom: 0.25rem;
  }

  .header-grid .value {
    font-size: 0.875rem;
    line-height: 1.25rem;
    font-weight: 600;
    color: var(--cds-text-primary, #161616);
  }
</style>
