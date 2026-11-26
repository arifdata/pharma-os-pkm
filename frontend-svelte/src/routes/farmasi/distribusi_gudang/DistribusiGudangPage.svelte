<script>
  import { onMount } from "svelte";
  import {
    Button,
    DataTable,
    DataTableSkeleton,
    DatePicker,
    DatePickerInput,
    Modal,
    NumberInput,
    Pagination,
    Select,
    SelectItem,
    Tag,
    Toolbar,
    ToolbarContent,
  } from "carbon-components-svelte";
  import { Renew, ShoppingCart } from "carbon-icons-svelte";
  import { Indonesian } from "flatpickr/dist/l10n/id";

  import { pb } from "../../../pb/client.svelte";
  import { notif } from "../../../lib/notif.svelte";
  import { DistribusiItemSchema } from "../../../validation-schema";

  /** @type {any[]} */
  let rows = $state([]);
  /** @type {{id:string,subunit:string,is_active:boolean}[]} */
  let subunits = $state([]);
  let loading = $state(true);
  let reloading = $state(false);
  let error = $state("");
  let currentPage = $state(1);
  let pageSize = $state(10);
  let totalItems = $state(0);

  // --- modal distribusi ---
  let modalOpen = $state(false);
  /** @type {any|null} */
  let target = $state(null);
  let inputTujuan = $state("");
  let inputJumlah = $state(1);
  let inputTanggal = $state("");
  let submitting = $state(false);

  // --- distribusi massal (banyak item, satu subunit tujuan) ---
  /** @type {string[]} id baris stok_gudang yang dicentang */
  let selectedRowIds = $state([]);
  let bulkModalOpen = $state(false);
  let bulkTujuan = $state("");
  let bulkTanggal = $state("");
  let bulkSubmitting = $state(false);
  /** @type {{id:string,item:string,nama_bmhp:string,no_batch:string,tanggal_expired:string,stok:number,jumlah:number}[]} */
  let bulkItems = $state([]);

  const headers = [
    { key: "nama_bmhp", value: "Nama Item", width: "30%" },
    { key: "no_batch", value: "Nomor Batch" },
    { key: "tanggal_expired", value: "Tgl Kadaluarsa" },
    { key: "jumlah", value: "Jumlah" },
    { key: "actions", value: "" },
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

  /** @returns {string} yyyy-mm-dd */
  function today() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${now.getFullYear()}-${month}-${day}`;
  }

  /**
   * Stok yang bisa didistribusikan: aktif dan masih ada jumlahnya.
   */
  async function loadData() {
    try {
      const result = await pb.collection("stok_gudang").getList(currentPage, pageSize, {
        filter: pb.filter("is_active = true && jumlah > {:min}", { min: 0 }),
        expand: "item,item.nama_bmhp",
        sort: "created",
      });
      totalItems = result.totalItems;
      // buang centang yang barisnya tidak lagi tampil (mis. setelah reload)
      const visibleIds = new Set(result.items.map((/** @type {any} */ r) => r.id));
      selectedRowIds = selectedRowIds.filter((id) => visibleIds.has(id));
      rows = result.items.map((/** @type {any} */ r) => {
        const item = r.expand?.["item"];
        return {
          id: r.id,
          item: item?.id ?? "",
          nama_bmhp: item?.expand?.["nama_bmhp"]?.["nama_bmhp"] ?? "-",
          no_batch: item?.["no_batch"] || "-",
          tanggal_expired: formatDate(item?.["tanggal_expired"]),
          jumlah: r["jumlah"] ?? 0,
        };
      });
      error = "";
    } catch (e) {
      error = /** @type {Error} */ (e).message ?? "Gagal memuat data";
    }
  }

  async function loadSubunits() {
    try {
      const records = await pb.collection("subunits").getFullList({ sort: "subunit" });
      subunits = records.map((/** @type {any} */ r) => ({
        id: r.id,
        subunit: r.subunit,
        is_active: Boolean(r.is_active),
      }));
    } catch (e) {
      notif.add({
        kind: "error",
        title: "Gagal memuat subunit",
        subtitle: /** @type {Error} */ (e).message ?? "",
        timeout: 3000,
      });
    }
  }

  async function reload() {
    reloading = true;
    await loadData();
    reloading = false;
  }

  /** @param {any} row */
  function openDistribusi(row) {
    target = row;
    inputTujuan = "";
    inputJumlah = 1;
    inputTanggal = today();
    modalOpen = true;
  }

  function closeModal() {
    modalOpen = false;
    target = null;
    submitting = false;
  }

  async function submitDistribusi() {
    if (!target) return;

    const parsed = DistribusiItemSchema.safeParse({
      tujuan: inputTujuan,
      jumlah: Number(inputJumlah),
      tanggal_distribusi: inputTanggal,
    });
    if (!parsed.success) {
      notif.add({
        kind: "error",
        title: parsed.error.issues[0].message,
        timeout: 3000,
      });
      return;
    }
    if (parsed.data.jumlah > target.jumlah) {
      notif.add({
        kind: "error",
        title: `Jumlah melebihi stok tersedia (${target.jumlah})`,
        timeout: 3000,
      });
      return;
    }

    submitting = true;
    try {
      await pb.collection("distribusi_item_gudang").create({
        tanggal_distribusi: `${parsed.data.tanggal_distribusi} 00:00:00.000Z`,
        item: target.item,
        jumlah: parsed.data.jumlah,
        tujuan: parsed.data.tujuan,
      });
      const subunit = subunits.find((s) => s.id === parsed.data.tujuan);
      notif.add({
        kind: "success",
        title: `Distribusi ${target.nama_bmhp} ke ${subunit?.subunit ?? "subunit"} tersimpan`,
        subtitle: subunit?.is_active
          ? "Stok subunit ikut dicatat."
          : "Subunit nonaktif, stok subunit tidak dicatat.",
        timeout: 4000,
      });
      closeModal();
      await reload();
    } catch (e) {
      notif.add({
        kind: "error",
        title: "Gagal menyimpan distribusi",
        subtitle: /** @type {Error} */ (e).message ?? "",
        timeout: 4000,
      });
      submitting = false;
    }
  }

  /** @param {CustomEvent<{ row: any, selected: boolean }>} event */
  function onRowSelect(event) {
    const { row, selected } = event.detail;
    selectedRowIds = selected
      ? [...selectedRowIds, row.id]
      : selectedRowIds.filter((id) => id !== row.id);
  }

  /** @param {CustomEvent<{ selected: boolean }>} event */
  function onHeaderSelect(event) {
    const pageIds = rows.map((r) => r.id);
    selectedRowIds = event.detail.selected
      ? [...new Set([...selectedRowIds, ...pageIds])]
      : selectedRowIds.filter((id) => !pageIds.includes(id));
  }

  function openBulkDistribusi() {
    const selected = rows.filter((r) => selectedRowIds.includes(r.id));
    if (selected.length === 0) {
      notif.add({
        kind: "warning",
        title: "Pilih minimal satu item terlebih dahulu",
        timeout: 3000,
      });
      return;
    }
    bulkItems = selected.map((r) => ({
      id: r.id,
      item: r.item,
      nama_bmhp: r.nama_bmhp,
      no_batch: r.no_batch,
      tanggal_expired: r.tanggal_expired,
      stok: r.jumlah,
      jumlah: r.jumlah,
    }));
    bulkTujuan = "";
    bulkTanggal = today();
    bulkModalOpen = true;
  }

  function closeBulkModal() {
    bulkModalOpen = false;
    bulkItems = [];
    bulkTujuan = "";
    bulkTanggal = "";
    bulkSubmitting = false;
  }

  async function submitBulkDistribusi() {
    if (bulkItems.length === 0) return;

    // validasi semua item dulu supaya tidak ada distribusi setengah jalan
    for (const it of bulkItems) {
      const parsed = DistribusiItemSchema.safeParse({
        tujuan: bulkTujuan,
        jumlah: Number(it.jumlah),
        tanggal_distribusi: bulkTanggal,
      });
      if (!parsed.success) {
        notif.add({
          kind: "error",
          title: `${it.nama_bmhp}: ${parsed.error.issues[0].message}`,
          timeout: 4000,
        });
        return;
      }
      if (parsed.data.jumlah > it.stok) {
        notif.add({
          kind: "error",
          title: `${it.nama_bmhp}: jumlah melebihi stok tersedia (${it.stok})`,
          timeout: 4000,
        });
        return;
      }
    }

    bulkSubmitting = true;
    let berhasil = 0;
    try {
      for (const it of bulkItems) {
        await pb.collection("distribusi_item_gudang").create({
          tanggal_distribusi: `${bulkTanggal} 00:00:00.000Z`,
          item: it.item,
          jumlah: Number(it.jumlah),
          tujuan: bulkTujuan,
        });
        berhasil += 1;
      }
      const subunit = subunits.find((s) => s.id === bulkTujuan);
      notif.add({
        kind: "success",
        title: `${berhasil} item didistribusikan ke ${subunit?.subunit ?? "subunit"}`,
        subtitle: subunit?.is_active
          ? "Stok subunit ikut dicatat."
          : "Subunit nonaktif, stok subunit tidak dicatat.",
        timeout: 4000,
      });
      selectedRowIds = [];
      closeBulkModal();
      await reload();
    } catch (e) {
      notif.add({
        kind: "error",
        title: `Gagal pada item ke-${berhasil + 1} (${berhasil} item tersimpan)`,
        subtitle: /** @type {Error} */ (e).message ?? "",
        timeout: 5000,
      });
      // tutup & kosongkan pilihan supaya input jumlah tidak basi, lalu muat ulang
      // supaya stok yang sudah terpotong terlihat
      selectedRowIds = [];
      closeBulkModal();
      await reload();
    } finally {
      bulkSubmitting = false;
    }
  }

  /** @type {number | undefined} */
  let appliedPageSize;

  /**
   * @param {CustomEvent<{ page: number, pageSize: number }>} event
   */
  function handlePageUpdate(event) {
    if (appliedPageSize === undefined) appliedPageSize = event.detail.pageSize;
    if (event.detail.pageSize !== appliedPageSize) {
      appliedPageSize = event.detail.pageSize;
      if (currentPage !== 1) {
        currentPage = 1;
        return;
      }
    }
    loadData();
  }

  onMount(() =>
    Promise.all([loadData(), loadSubunits()]).finally(() => (loading = false))
  );
</script>

{#if loading}
  <DataTableSkeleton columns={5} rows={5} headers={headers} />
{:else if error !== ""}
  <p class="error">{error}</p>
{:else}
  <DataTable
    title="Distribusi Gudang"
    {headers}
    {rows}
    zebra
    selectable
    {selectedRowIds}
    on:click:row--select={onRowSelect}
    on:click:header--select={onHeaderSelect}
  >
    <Toolbar>
      <ToolbarContent>
        <Button
          icon={Renew}
          iconDescription="Reload Data"
          tooltipPosition="top"
          disabled={reloading}
          on:click={reload}
        />
        <Button
          kind="tertiary"
          size="small"
          icon={ShoppingCart}
          disabled={selectedRowIds.length === 0}
          on:click={openBulkDistribusi}
        >
          Distribusi Sekaligus{selectedRowIds.length > 0 ? ` (${selectedRowIds.length})` : ""}
        </Button>
      </ToolbarContent>
    </Toolbar>
    <svelte:fragment slot="cell" let:row let:cell>
      {#if cell.key === "actions"}
        <Button
          size="small"
          icon={ShoppingCart}
          iconDescription={`Distribusikan ${row.nama_bmhp}`}
          tooltipPosition="left"
          on:click={() => openDistribusi(row)}
        >
          Distribusi
        </Button>
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

<Modal
  size="sm"
  bind:open={modalOpen}
  primaryButtonText={submitting ? "Menyimpan..." : "Distribusikan"}
  secondaryButtonText="Batal"
  primaryButtonDisabled={submitting}
  on:click:button--primary={submitDistribusi}
  on:click:button--secondary={closeModal}
>
  {#if target}
    <div class="distribusi-form">
      <div class="item-summary">
        <div class="item-title">{target.nama_bmhp}</div>
        <div class="item-meta">
          <span>Batch: {target.no_batch}</span>
          <span>Exp: {target.tanggal_expired}</span>
          <span>Stok tersedia: {target.jumlah}</span>
        </div>
      </div>

      <Select labelText="Subunit Tujuan" bind:selected={inputTujuan}>
        <SelectItem value="" text="Pilih subunit..." />
        {#each subunits as s (s.id)}
          <SelectItem value={s.id} text={s.is_active ? s.subunit : `${s.subunit} (nonaktif)`} />
        {/each}
      </Select>

      <NumberInput
        labelText="Jumlah"
        bind:value={inputJumlah}
        min={1}
        max={target.jumlah}
        invalidText="Jumlah harus antara 1 dan stok tersedia"
      />

      <DatePicker
        datePickerType="single"
        locale={Indonesian}
        dateFormat="Y-m-d"
        on:change
        bind:value={inputTanggal}
      >
        <DatePickerInput labelText="Tanggal Distribusi" placeholder="yyyy-mm-dd" />
      </DatePicker>

      {#if inputTujuan !== ""}
        {@const tujuan = subunits.find((s) => s.id === inputTujuan)}
        <Tag size="sm" type={tujuan?.is_active ? "green" : "red"}>
          {tujuan?.is_active
            ? "Subunit aktif — stok subunit dicatat"
            : "Subunit nonaktif — stok subunit tidak dicatat"}
        </Tag>
      {/if}
    </div>
  {/if}
</Modal>

<Modal
  size="lg"
  bind:open={bulkModalOpen}
  primaryButtonText={bulkSubmitting ? "Menyimpan..." : "Distribusikan Semua"}
  secondaryButtonText="Batal"
  primaryButtonDisabled={bulkSubmitting}
  on:click:button--primary={submitBulkDistribusi}
  on:click:button--secondary={closeBulkModal}
>
  <div class="distribusi-form">
    <p class="bulk-hint">
      {bulkItems.length} item akan didistribusikan ke satu subunit tujuan.
    </p>

    <Select labelText="Subunit Tujuan" bind:selected={bulkTujuan}>
      <SelectItem value="" text="Pilih subunit..." />
      {#each subunits as s (s.id)}
        <SelectItem value={s.id} text={s.is_active ? s.subunit : `${s.subunit} (nonaktif)`} />
      {/each}
    </Select>

    <DatePicker
      datePickerType="single"
      locale={Indonesian}
      dateFormat="Y-m-d"
      on:change
      bind:value={bulkTanggal}
    >
      <DatePickerInput labelText="Tanggal Distribusi" placeholder="yyyy-mm-dd" />
    </DatePicker>

    {#if bulkTujuan !== ""}
      {@const tujuan = subunits.find((s) => s.id === bulkTujuan)}
      <Tag size="sm" type={tujuan?.is_active ? "green" : "red"}>
        {tujuan?.is_active
          ? "Subunit aktif — stok subunit dicatat"
          : "Subunit nonaktif — stok subunit tidak dicatat"}
      </Tag>
    {/if}

    <div class="bulk-list">
      {#each bulkItems as it (it.id)}
        <div class="bulk-item">
          <div class="bulk-item__info">
            <div class="item-title">{it.nama_bmhp}</div>
            <div class="item-meta">
              <span>Batch: {it.no_batch}</span>
              <span>Exp: {it.tanggal_expired}</span>
              <span>Stok: {it.stok}</span>
            </div>
          </div>
          <div class="bulk-item__jumlah">
            <NumberInput
              labelText={`Jumlah ${it.nama_bmhp}`}
              hideLabel
              size="sm"
              bind:value={it.jumlah}
              min={1}
              max={it.stok}
              invalidText="Jumlah harus antara 1 dan stok tersedia"
            />
          </div>
        </div>
      {/each}
    </div>
  </div>
</Modal>

<style>
  .error {
    color: var(--cds-text-error, #da1e28);
    padding: 1rem;
  }

  .distribusi-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .item-title {
    font-size: 0.875rem;
    font-weight: 600;
    line-height: 1.25rem;
    color: var(--cds-text-primary, #161616);
    margin-bottom: 0.25rem;
  }

  .item-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 1rem;
    font-size: 0.75rem;
    line-height: 1rem;
    color: var(--cds-text-secondary, #525252);
  }

  .bulk-hint {
    margin: 0;
    font-size: 0.875rem;
    color: var(--cds-text-secondary, #525252);
  }

  .bulk-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 18rem;
    overflow-y: auto;
    padding-right: 0.25rem;
  }

  .bulk-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 0.75rem;
    /* --cds-layer-0X tidak ada di css/all.css bawaan; pakai token ui-0X yang
       ikut berubah per tema (terang/gelap) */
    background: var(--cds-ui-02, #f4f4f4);
    border-left: 2px solid var(--cds-ui-03, #e0e0e0);
  }

  .bulk-item__info {
    flex: 1 1 auto;
    min-width: 0;
  }

  .bulk-item__jumlah {
    flex: 0 0 8rem;
  }
</style>
