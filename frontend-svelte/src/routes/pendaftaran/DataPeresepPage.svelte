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
  import { notif } from "../../lib/notif.svelte";
  import { DataPeresepSchema } from "../../validation-schema";

  /** @type {any[]} */
  let allRows = $state([]);
  let loading = $state(true);
  let error = $state("");
  let searchTerm = $state("");
  let reloading = $state(false);
  let currentPage = $state(1);
  let pageSize = $state(10);

  let openAddModal = $state(false);
  let inputNamaPeresep = $state("");

  let openEditModal = $state(false);
  let editTargetId = $state("");
  let editNamaPeresep = $state("");

  let openDeleteModal = $state(false);
  let deleteTargetId = $state("");
  let deleteTargetName = $state("");

  const headers = [
    { key: "nama_peresep", value: "Nama Peresep", width: "80%" },
    { key: "actions", value: "Actions" },
  ];

  let rows = $derived(
    searchTerm.trim() === ""
      ? allRows
      : allRows.filter((r) =>
          String(r.nama_peresep ?? "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        )
  );

  $effect(() => {
    rows;
    currentPage = 1;
  });

  async function loadData() {
    try {
      const records = await pb.collection("data_peresep").getFullList({
        sort: "nama_peresep",
      });
      allRows = records.map((/** @type {any} */ r) => ({
        id: r.id,
        nama_peresep: r.nama_peresep,
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
    const parsed = DataPeresepSchema.safeParse(data);
    if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
    return { ok: true, data: parsed.data };
  }

  function closeAddModal() {
    openAddModal = false;
    inputNamaPeresep = "";
  }

  async function submitAdd() {
    const result = validate({ nama_peresep: inputNamaPeresep });
    if (!result.ok) {
      notify("error", result.message);
      return;
    }

    try {
      const record = await pb.collection("data_peresep").create(result.data);
      closeAddModal();
      notify("success", `Menambahkan ${record["nama_peresep"]}`);
      await reload();
    } catch (e) {
      notify("error", /** @type {Error} */ (e).message ?? "Gagal menambah data");
    }
  }

  /** @param {any} row */
  function openEdit(row) {
    editTargetId = row.id;
    editNamaPeresep = row.nama_peresep;
    openEditModal = true;
  }

  async function submitEdit() {
    const result = validate({ nama_peresep: editNamaPeresep });
    if (!result.ok) {
      notify("error", result.message);
      return;
    }

    try {
      await pb.collection("data_peresep").update(editTargetId, result.data);
      openEditModal = false;
      notify("success", "Data peresep berhasil diperbarui");
      await reload();
    } catch (e) {
      notify("error", /** @type {Error} */ (e).message ?? "Gagal memperbarui data");
    }
  }

  /** @param {any} row */
  function openDelete(row) {
    deleteTargetId = row.id;
    deleteTargetName = row.nama_peresep;
    openDeleteModal = true;
  }

  async function submitDelete() {
    if (!deleteTargetId) {
      notify("error", "Target hapus tidak valid");
      return;
    }
    try {
      await pb.collection("data_peresep").delete(deleteTargetId);
      openDeleteModal = false;
      deleteTargetId = "";
      deleteTargetName = "";
      notify("success", "Data peresep berhasil dihapus");
      await reload();
    } catch (e) {
      notify("error", /** @type {Error} */ (e).message ?? "Gagal menghapus data");
    }
  }

  onMount(() => loadData().finally(() => (loading = false)));
</script>

{#if loading}
  <DataTableSkeleton columns={2} rows={5} headers={headers} />
{:else if error !== ""}
  <p class="error">{error}</p>
{:else}
  <DataTable
    title="Data Peresep"
    size="short"
    {headers}
    {rows}
    {pageSize}
    page={currentPage}
    sortable
  >
    <Toolbar>
      <ToolbarContent>
        <ToolbarSearch
          bind:value={searchTerm}
          on:clear={() => (searchTerm = "")}
          placeholder="Cari nama peresep"
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
          iconDescription="Tambah Peresep"
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
          iconDescription={`Edit ${row.nama_peresep}`}
          tooltipPosition="left"
          on:click={() => openEdit(row)}
        />
        <Button
          size="small"
          kind="ghost"
          icon={TrashCan}
          iconDescription={`Hapus ${row.nama_peresep}`}
          tooltipPosition="right"
          on:click={() => openDelete(row)}
        />
      {:else if cell.key === "nama_peresep"}
        {cell.value ? cell.value.toUpperCase() : "-"}
      {:else}
        {cell.value || "-"}
      {/if}
    </svelte:fragment>
  </DataTable>

  <Pagination
    bind:page={currentPage}
    bind:pageSize
    totalItems={rows.length}
    pageSizes={[5, 10, 20, 50]}
    size="sm"
  />

  <Modal
    bind:open={openAddModal}
    primaryButtonText="Submit"
    secondaryButtonText="Cancel"
    on:click:button--primary={submitAdd}
    on:click:button--secondary={closeAddModal}
  >
    <TextInput
      bind:value={inputNamaPeresep}
      labelText="Nama Peresep"
      placeholder="Masukkan nama peresep"
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
      bind:value={editNamaPeresep}
      labelText="Nama Peresep"
      placeholder="Masukkan nama peresep"
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
    <p>Apakah Anda yakin ingin menghapus peresep "{deleteTargetName.toUpperCase()}"?</p>
  </Modal>
{/if}

<style>
  .error {
    color: var(--cds-text-error, #da1e28);
    padding: 1rem;
  }
</style>
