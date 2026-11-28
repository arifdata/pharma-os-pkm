<script>
  import { onMount } from "svelte";
  import {
    Button,
    DataTable,
    DataTableSkeleton,
    Modal,
    Pagination,
    TextInput,
    Toolbar,
    ToolbarContent,
    ToolbarSearch,
  } from "carbon-components-svelte";
  import { Renew, Add, TrashCan, Edit } from "carbon-icons-svelte";

  import { pb } from "../../pb/client.svelte";
  import EmptyState from "../../lib/EmptyState.svelte";
  import ErrorState from "../../lib/ErrorState.svelte";
  import PageShell from "../../lib/PageShell.svelte";
  import { debounce, pageUpdateHandler, sortParam } from "../../lib/table";
  import { notif } from "../../lib/notif.svelte";
  import { DataDiagnosaSchema } from "../../validation-schema";

  /** @type {any[]} */
  let rows = $state([]);
  let loading = $state(true);
  let error = $state("");
  let searchTerm = $state("");
  let reloading = $state(false);
  let currentPage = $state(1);
  let pageSize = $state(10);
  let totalItems = $state(0);
  /** @type {string | undefined} */
  let sortKey = $state("nama_diagnosa");
  /** @type {"ascending" | "descending" | "none"} */
  let sortDirection = $state("ascending");

  let openAddModal = $state(false);
  let inputNamaDiagnosa = $state("");

  let openEditModal = $state(false);
  let editTargetId = $state("");
  let editNamaDiagnosa = $state("");

  let openDeleteModal = $state(false);
  let deleteTargetId = $state("");
  let deleteTargetName = $state("");

  /** @type {{ key: string, value: string, width?: string, sort?: false }[]} */
  const headers = [
    { key: "nama_diagnosa", value: "Nama Diagnosa", width: "80%" },
    { key: "actions", value: "Actions", sort: false },
  ];

  async function loadData() {
    const filters = [];
    /** @type {Record<string, string>} */
    const params = {};
    const q = searchTerm.trim();
    if (q !== "") {
      filters.push("nama_diagnosa ~ {:q}");
      params.q = q;
    }
    try {
      const result = await pb.collection("data_diagnosa").getList(currentPage, pageSize, {
        filter: filters.length > 0 ? pb.filter(filters.join(" && "), params) : "",
        sort: sortParam(sortKey, sortDirection, "nama_diagnosa"),
      });
      totalItems = result.totalItems;
      rows = result.items.map((/** @type {any} */ r) => ({
        id: r.id,
        nama_diagnosa: r.nama_diagnosa,
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

  /**
   * Sorting dikerjakan server-side; `preventDefault` mencegah DataTable
   * mengurutkan hanya halaman aktif (yang urutannya bisa berbeda).
   *
   * @param {CustomEvent<{ key: string | null, direction: "ascending" | "descending" | "none" }>} event
   */
  function onSort(event) {
    event.preventDefault();
    sortKey = event.detail.key ?? "nama_diagnosa";
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

  const applySearch = debounce(reloadFromFirstPage);

  /** @param {string} value */
  function onSearch(value) {
    searchTerm = value;
    applySearch();
  }

  /**
   * @param {"success" | "error"} kind
   * @param {string} subtitle
   */
  function notify(kind, subtitle) {
    notif.add({ kind, subtitle, timeout: 3000 });
  }

  /**
   * @param {any} data
   * @returns {{ok: true, data: any} | {ok: false, message: string}}
   */
  function validate(data) {
    const parsed = DataDiagnosaSchema.safeParse(data);
    if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
    return { ok: true, data: parsed.data };
  }

  function closeAddModal() {
    openAddModal = false;
    inputNamaDiagnosa = "";
  }

  async function submitAdd() {
    const result = validate({ nama_diagnosa: inputNamaDiagnosa });
    if (!result.ok) {
      notify("error", result.message);
      return;
    }

    try {
      const record = await pb.collection("data_diagnosa").create(result.data);
      closeAddModal();
      notify("success", `Menambahkan ${record["nama_diagnosa"]}`);
      await reload();
    } catch (e) {
      notify("error", /** @type {Error} */ (e).message ?? "Gagal menambah data");
    }
  }

  /** @param {any} row */
  function openEdit(row) {
    editTargetId = row.id;
    editNamaDiagnosa = row.nama_diagnosa;
    openEditModal = true;
  }

  async function submitEdit() {
    const result = validate({ nama_diagnosa: editNamaDiagnosa });
    if (!result.ok) {
      notify("error", result.message);
      return;
    }

    try {
      await pb.collection("data_diagnosa").update(editTargetId, result.data);
      openEditModal = false;
      notify("success", "Data diagnosa berhasil diperbarui");
      await reload();
    } catch (e) {
      notify("error", /** @type {Error} */ (e).message ?? "Gagal memperbarui data");
    }
  }

  /** @param {any} row */
  function openDelete(row) {
    deleteTargetId = row.id;
    deleteTargetName = row.nama_diagnosa;
    openDeleteModal = true;
  }

  async function submitDelete() {
    if (!deleteTargetId) {
      notify("error", "Target hapus tidak valid");
      return;
    }
    try {
      await pb.collection("data_diagnosa").delete(deleteTargetId);
      openDeleteModal = false;
      deleteTargetId = "";
      deleteTargetName = "";
      notify("success", "Data diagnosa berhasil dihapus");
      await reload();
    } catch (e) {
      notify("error", /** @type {Error} */ (e).message ?? "Gagal menghapus data");
    }
  }

  onMount(() => loadData().finally(() => (loading = false)));
</script>

<PageShell title="Data Diagnosa" subtitle="Daftar diagnosa yang tersedia untuk pendaftaran.">
{#if loading}
  <DataTableSkeleton columns={2} rows={5} headers={headers} />
{:else if error !== ""}
  <ErrorState message="Gagal memuat data diagnosa" description={error} onRetry={reload} />
{:else}
  <DataTable
    size="short"
    {headers}
    {rows}
    zebra
    sortable
    bind:sortKey
    bind:sortDirection
    on:sort={onSort}
  >
    <Toolbar>
      <ToolbarContent>
        <ToolbarSearch
          bind:value={searchTerm}
          on:input={(/** @type {any} */ e) => onSearch(e.target?.value ?? "")}
          on:clear={() => onSearch("")}
          placeholder="Cari nama diagnosa"
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
          iconDescription="Tambah Diagnosa"
          tooltipPosition="top"
          on:click={() => (openAddModal = true)}
        />
      </ToolbarContent>
    </Toolbar>
    <svelte:fragment slot="cell" let:row let:cell>
      {#if cell.key === "actions"}
        <Button
          size="small"
          kind="ghost"
          icon={Edit}
          iconDescription={`Edit ${row.nama_diagnosa}`}
          tooltipPosition="left"
          on:click={() => openEdit(row)}
        />
        <Button
          size="small"
          kind="ghost"
          icon={TrashCan}
          iconDescription={`Hapus ${row.nama_diagnosa}`}
          tooltipPosition="right"
          on:click={() => openDelete(row)}
        />
      {:else}
        {cell.value || "-"}
      {/if}
    </svelte:fragment>
  </DataTable>

  {#if totalItems === 0}
    <EmptyState
      title={searchTerm.trim() !== "" ? "Tidak ada hasil" : "Belum ada data diagnosa"}
      description={searchTerm.trim() !== ""
        ? "Tidak ada diagnosa yang cocok dengan pencarian."
        : "Data diagnosa yang ditambahkan akan tampil di sini."}
      actionLabel={searchTerm.trim() !== "" ? "Hapus pencarian" : "Tambah Diagnosa"}
      onAction={searchTerm.trim() !== "" ? () => onSearch("") : () => (openAddModal = true)}
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

  <Modal
    bind:open={openAddModal}
    primaryButtonText="Submit"
    secondaryButtonText="Cancel"
    on:click:button--primary={submitAdd}
    on:click:button--secondary={closeAddModal}
  >
    <TextInput
      bind:value={inputNamaDiagnosa}
      labelText="Nama Diagnosa"
      placeholder="Masukkan nama diagnosa"
    />
  </Modal>

  <Modal
    bind:open={openEditModal}
    primaryButtonText="Simpan"
    secondaryButtonText="Batal"
    on:click:button--primary={submitEdit}
    on:click:button--secondary={() => (openEditModal = false)}
  >
    <TextInput
      bind:value={editNamaDiagnosa}
      labelText="Nama Diagnosa"
      placeholder="Masukkan nama diagnosa"
    />
  </Modal>

  <Modal
    bind:open={openDeleteModal}
    danger
    primaryButtonText="Ya"
    secondaryButtonText="Tidak"
    on:click:button--primary={submitDelete}
    on:click:button--secondary={() => (openDeleteModal = false)}
  >
    <p>Apakah Anda yakin ingin menghapus diagnosa "{deleteTargetName}"?</p>
  </Modal>
