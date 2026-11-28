<script>
  import { onMount } from "svelte";
  import {
    Button,
    Checkbox,
    DataTable,
    DataTableSkeleton,
    Modal,
    Pagination,
    Tag,
    TextInput,
    Toolbar,
    ToolbarContent,
    ToolbarSearch,
  } from "carbon-components-svelte";
  import { Renew, Add, TrashCan, Edit } from "carbon-icons-svelte";

  import { pb } from "../../../pb/client.svelte";
  import EmptyState from "../../../lib/EmptyState.svelte";
  import ErrorState from "../../../lib/ErrorState.svelte";
  import PageShell from "../../../lib/PageShell.svelte";
  import { debounce, pageUpdateHandler, sortParam } from "../../../lib/table";
  import { notif } from "../../../lib/notif.svelte";
  import { SubunitSchema } from "../../../validation-schema";

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
  let sortKey = $state("subunit");
  /** @type {"ascending" | "descending" | "none"} */
  let sortDirection = $state("ascending");

  let openAddModal = $state(false);
  let inputSubunit = $state("");
  let inputIsActive = $state(true);

  let openEditModal = $state(false);
  let editTargetId = $state("");
  let editSubunit = $state("");
  let editIsActive = $state(true);

  let openDeleteModal = $state(false);
  let deleteTargetId = $state("");
  let deleteTargetName = $state("");

  /** @type {{ key: string, value: string, width?: string, sort?: false }[]} */
  const headers = [
    { key: "subunit", value: "Subunit", width: "60%" },
    { key: "is_active", value: "Status" },
    { key: "actions", value: "Actions", sort: false },
  ];

  async function loadData() {
    const filters = [];
    /** @type {Record<string, string>} */
    const params = {};
    const q = searchTerm.trim();
    if (q !== "") {
      filters.push("subunit ~ {:q}");
      params.q = q;
    }
    try {
      const result = await pb.collection("subunits").getList(currentPage, pageSize, {
        filter: filters.length > 0 ? pb.filter(filters.join(" && "), params) : "",
        sort: sortParam(sortKey, sortDirection, "subunit"),
      });
      totalItems = result.totalItems;
      rows = result.items.map((/** @type {any} */ r) => ({
        id: r.id,
        subunit: r.subunit,
        is_active: Boolean(r.is_active),
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
    sortKey = event.detail.key ?? "subunit";
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

  function clearAddFields() {
    inputSubunit = "";
    inputIsActive = true;
  }

  function closeAddModal() {
    openAddModal = false;
    clearAddFields();
  }

  async function submitAdd() {
    const parsed = SubunitSchema.safeParse({ subunit: inputSubunit });
    if (!parsed.success) {
      notify("error", parsed.error.issues[0].message);
      return;
    }

    try {
      const record = await pb.collection("subunits").create({
        subunit: parsed.data.subunit,
        is_active: inputIsActive,
      });
      closeAddModal();
      notify("success", `Menambahkan ${record["subunit"]}`);
      await reload();
    } catch (e) {
      notify("error", /** @type {Error} */ (e).message ?? "Gagal menambah data");
    }
  }

  /** @param {any} row */
  function openEdit(row) {
    editTargetId = row.id;
    editSubunit = row.subunit;
    editIsActive = row.is_active;
    openEditModal = true;
  }

  async function submitEdit() {
    const parsed = SubunitSchema.safeParse({ subunit: editSubunit });
    if (!parsed.success) {
      notify("error", parsed.error.issues[0].message);
      return;
    }

    try {
      await pb.collection("subunits").update(editTargetId, {
        subunit: parsed.data.subunit,
        is_active: editIsActive,
      });
      openEditModal = false;
      notify("success", "Data berhasil diperbarui");
      await reload();
    } catch (e) {
      notify("error", /** @type {Error} */ (e).message ?? "Gagal memperbarui data");
    }
  }

  /** @param {any} row */
  function openDelete(row) {
    deleteTargetId = row.id;
    deleteTargetName = row.subunit;
    openDeleteModal = true;
  }

  async function submitDelete() {
    if (!deleteTargetId) {
      notify("error", "Target hapus tidak valid");
      return;
    }
    try {
      await pb.collection("subunits").delete(deleteTargetId);
      openDeleteModal = false;
      deleteTargetId = "";
      deleteTargetName = "";
      notify("success", "Data berhasil dihapus");
      await reload();
    } catch (e) {
      notify("error", /** @type {Error} */ (e).message ?? "Gagal menghapus data");
    }
  }

  onMount(() => loadData().finally(() => (loading = false)));
</script>

<PageShell title="Subunit" subtitle="Unit tujuan distribusi stok gudang.">
{#if loading}
  <DataTableSkeleton columns={3} rows={5} headers={headers} />
{:else if error !== ""}
  <ErrorState message="Gagal memuat data subunit" description={error} onRetry={reload} />
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
          placeholder="Cari subunit"
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
          iconDescription="Tambah Subunit"
          tooltipPosition="top"
          on:click={() => (openAddModal = true)}
        />
      </ToolbarContent>
    </Toolbar>
    <svelte:fragment slot="cell" let:row let:cell>
      {#if cell.key === "is_active"}
        <Tag size="sm" type={row.is_active ? "green" : "red"}>
          {row.is_active ? "Aktif" : "Nonaktif"}
        </Tag>
      {:else if cell.key === "actions"}
        <Button
          size="small"
          kind="ghost"
          icon={Edit}
          iconDescription={`Edit ${row.subunit}`}
          tooltipPosition="left"
          on:click={() => openEdit(row)}
        />
        <Button
          size="small"
          kind="ghost"
          icon={TrashCan}
          iconDescription={`Hapus ${row.subunit}`}
          tooltipPosition="right"
          on:click={() => openDelete(row)}
        />
      {:else}
        {cell.value}
      {/if}
    </svelte:fragment>
  </DataTable>

  {#if totalItems === 0}
    <EmptyState
      title={searchTerm.trim() !== "" ? "Tidak ada hasil" : "Belum ada subunit"}
      description={searchTerm.trim() !== ""
        ? "Tidak ada subunit yang cocok dengan pencarian."
        : "Tambahkan subunit sebagai tujuan distribusi."}
      actionLabel={searchTerm.trim() !== "" ? "Hapus pencarian" : "Tambah Subunit"}
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
      bind:value={inputSubunit}
      labelText="Nama Subunit"
      placeholder="Masukkan nama subunit"
    />
    <Checkbox bind:checked={inputIsActive} labelText="Aktif" />
  </Modal>

  <Modal
    bind:open={openEditModal}
    primaryButtonText="Simpan"
    secondaryButtonText="Batal"
    on:click:button--primary={submitEdit}
    on:click:button--secondary={() => (openEditModal = false)}
  >
    <TextInput
      bind:value={editSubunit}
      labelText="Nama Subunit"
      placeholder="Masukkan nama subunit"
    />
    <Checkbox bind:checked={editIsActive} labelText="Aktif" />
  </Modal>

  <Modal
    bind:open={openDeleteModal}
    danger
    primaryButtonText="Ya"
    secondaryButtonText="Tidak"
    on:click:button--primary={submitDelete}
    on:click:button--secondary={() => (openDeleteModal = false)}
  >
    <p>Apakah Anda yakin ingin menghapus subunit "{deleteTargetName}"?</p>
  </Modal>
