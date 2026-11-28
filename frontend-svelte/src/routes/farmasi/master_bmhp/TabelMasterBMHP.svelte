<script>
  import { onMount } from "svelte";
  import {
    Button,
    DataTable,
    DataTableSkeleton,
    Modal,
    TextInput,
    Toolbar,
    ToolbarContent,
    ToolbarSearch,
    TagSet,
    Tag,
    Pagination,
  } from "carbon-components-svelte";
  import { Renew, Add, TrashCan, Edit } from "carbon-icons-svelte";

  import { pb } from "../../../pb/client.svelte";
  import EmptyState from "../../../lib/EmptyState.svelte";
  import ErrorState from "../../../lib/ErrorState.svelte";
  import PageShell from "../../../lib/PageShell.svelte";
  import { debounce, pageUpdateHandler, sortParam } from "../../../lib/table";
  import { notif } from "../../../lib/notif.svelte";
  import { MasterBMHPSchema } from "../../../validation-schema";

  /** @type {any[]} */
  let rows = $state([]);
  let loading = $state(true);
  let error = $state("");
  let searchTerm = $state("");
  let reloading = $state(false);
  let openAddModal = $state(false);
  let inputBMHP = $state("");
  let inputBMHPLabels = $state("");
  let openDeleteModal = $state(false);
  let deleteTargetId = $state("");
  let openEditModal = $state(false);
  let editTargetId = $state("");
  let editBMHPName = $state("");
  let editBMHPLabels = $state("");
  let currentPage = $state(1);
  let pageSize = $state(10);
  let totalItems = $state(0);
  /** @type {string | undefined} */
  let sortKey = $state("nama_bmhp");
  /** @type {"ascending" | "descending" | "none"} */
  let sortDirection = $state("ascending");

  /** @type {{ key: string, value: string, width?: string, sort?: false }[]} */
  const headers = [
    { key: "nama_bmhp", value: "Nama BMHP", width: "50%" },
    { key: "labels", value: "Labels", sort: false },
    { key: "actions", value: "Actions", sort: false },
  ];

  async function loadData() {
    const filters = [];
    /** @type {Record<string, string>} */
    const params = {};
    const q = searchTerm.trim();
    if (q !== "") {
      filters.push("(nama_bmhp ~ {:q} || labels.label ~ {:q})");
      params.q = q;
    }
    try {
      const result = await pb.collection("master_bmhp").getList(currentPage, pageSize, {
        filter: filters.length > 0 ? pb.filter(filters.join(" && "), params) : "",
        expand: "labels",
        sort: sortParam(sortKey, sortDirection, "nama_bmhp"),
      });
      totalItems = result.totalItems;
      rows = result.items.map((/** @type {any} */ r) => ({
        id: r.id,
        nama_bmhp: r.nama_bmhp,
        labels: /** @type {any[]} */ (r.expand?.labels)?.map((l) => l.label).join(",") ?? "-",
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
    sortKey = event.detail.key ?? "nama_bmhp";
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

  function clearFields() {
    inputBMHP = "";
    inputBMHPLabels = "";
  }

  /**
   * Normalisasi label ke bentuk yang disimpan di master_bmhp_labels.
   * @param {string} label
   * @returns {string}
   */
  function normalizeLabel(label) {
    return label.toLowerCase().trim().replaceAll(" ", "-");
  }

  /**
   * Ambil id label dari master_bmhp_labels; buat hanya jika belum ada.
   * @param {string[]} labels
   * @returns {Promise<string[]>} daftar id label (unik)
   */
  async function resolveLabelIds(labels) {
    const normalized = labels.map(normalizeLabel).filter((l) => l !== "");
    if (normalized.length === 0) return [];

    const currentLabels = await pb.collection("master_bmhp_labels").getFullList();

    /** @type {Record<string, string>} */
    const mapLabels = {};
    for (const label of currentLabels) {
      mapLabels[normalizeLabel(label["label"])] = label["id"];
    }

    /** @type {Set<string>} */
    const ids = new Set();
    for (const label of normalized) {
      if (!Object.hasOwn(mapLabels, label)) {
        const record = await pb.collection("master_bmhp_labels").create({ label });
        mapLabels[label] = record["id"];
      }
      ids.add(mapLabels[label]);
    }
    return [...ids];
  }

  /**
   * @param {string} item
   * @param {string} input_tags
   * @returns {Promise<{ok: boolean, msg: string}>}
   */
  async function addBMHP(item, input_tags) {
    const submit = MasterBMHPSchema.safeParse({ nama_bmhp: item, labels: input_tags });
    if (!submit.success) {
      return { ok: false, msg: submit.error.issues[0].message };
    }

    const relasi_labels = await resolveLabelIds(input_tags.split(","));

    const record = await pb.collection('master_bmhp').create({
      nama_bmhp: item,
      labels: relasi_labels,
    });
    return {ok: true, msg: `Menambahkan ${record['nama_bmhp']}`}
  }

  async function submitBMHP() {
    let resp = await addBMHP(inputBMHP, inputBMHPLabels);
    openAddModal = false;
    clearFields();
    notif.add({
      kind: resp.ok ? "success" : "error",
      subtitle: resp.msg,
      timeout: 3000,
    });
    if (resp.ok) await reload();
  }

  async function deleteBMHP() {
    if (!deleteTargetId) {
      notif.add({
        kind: "error",
        subtitle: "Target hapus tidak valid",
        timeout: 3000,
      });
      return;
    }
    await pb.collection("master_bmhp").delete(deleteTargetId);
    openDeleteModal = false;
    deleteTargetId = "";
    notif.add({
      kind: "success",
      subtitle: "Data berhasil dihapus",
      timeout: 3000,
    });
    await reload();
  }

  /**
   * @param {any} row
   */
  function openEdit(row) {
    editTargetId = row.id;
    editBMHPName = row.nama_bmhp;
    editBMHPLabels = row.labels === "-" ? "" : row.labels;
    openEditModal = true;
  }

  async function submitEdit() {
    const submit = MasterBMHPSchema.safeParse({ nama_bmhp: editBMHPName, labels: editBMHPLabels });
    if (!submit.success) {
      notif.add({
        kind: "error",
        subtitle: submit.error.issues[0].message,
        timeout: 3000,
      });
      return;
    }

    const relasiLabels = await resolveLabelIds(editBMHPLabels.split(","));

    await pb.collection("master_bmhp").update(editTargetId, {
      nama_bmhp: editBMHPName,
      labels: relasiLabels,
    });

    openEditModal = false;
    notif.add({
      kind: "success",
      subtitle: "Data berhasil diperbarui",
      timeout: 3000,
    });
    await reload();
  }

  onMount(() => loadData().finally(() => (loading = false)));
</script>

<PageShell title="Master BMHP" subtitle="Daftar bahan medis habis pakai beserta labelnya.">
{#if loading}
  <DataTableSkeleton columns={3} rows={5} headers={headers} />
{:else if error !== ""}
  <ErrorState message="Gagal memuat master BMHP" description={error} onRetry={reload} />
{:else}
  <DataTable
    size="short"
    headers={headers}
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
          placeholder="Cari nama atau label"
          persistent
        />
        <Button
          icon={Renew}
          iconDescription="Reload Data"
          tooltipPosition="top"
          disabled={reloading}
          on:click={reload}
        >
        </Button>
        <Button
          icon={Add}
          iconDescription="Tambah Data"
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
          iconDescription={`Edit ${row.nama_bmhp}`}
          tooltipPosition="left"
          on:click={() => openEdit(row)}
        />
        <Button
          size="small"
          kind="ghost"
          icon={TrashCan}
          iconDescription={`Hapus ${row.nama_bmhp}`}
          tooltipPosition="right"
          on:click={() => {
            deleteTargetId = row.id;
            openDeleteModal = true;
          }}
        />
      {:else if cell.key === "labels"}
        <TagSet
          multiline
        >
        {#each cell.value.split(",") as item}
          <Tag size="sm" type="outline">{item}</Tag>
        {/each}
        </TagSet>
      {:else}
        {cell.value}
      {/if}
    </svelte:fragment>
  </DataTable>
  {#if totalItems === 0}
    <EmptyState
      title={searchTerm.trim() !== "" ? "Tidak ada hasil" : "Belum ada master BMHP"}
      description={searchTerm.trim() !== ""
        ? "Tidak ada BMHP yang cocok dengan pencarian."
        : "Data BMHP yang ditambahkan akan tampil di sini."}
      actionLabel={searchTerm.trim() !== "" ? "Hapus pencarian" : "Tambah BMHP"}
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

<Modal
    bind:open={openDeleteModal}
    danger
    primaryButtonText="Ya"
    secondaryButtonText="Tidak"
    on:click:button--primary={deleteBMHP}
    on:click:button--secondary={() => (openDeleteModal = false)}
  >
    <p>Apakah Anda yakin ingin menghapus data ini?</p>
  </Modal>
  <Modal
    bind:open={openEditModal}
    primaryButtonText="Simpan"
    secondaryButtonText="Batal"
    on:click:button--primary={submitEdit}
    on:click:button--secondary={() => (openEditModal = false)}
  >
    <TextInput bind:value={editBMHPName} labelText="Nama BMHP" placeholder="Masukkan nama BMHP" />
    <TextInput bind:value={editBMHPLabels} labelText="Labels" placeholder="pisahkan dengan koma ," />
  </Modal>
  <Modal
    bind:open={openAddModal}
    primaryButtonText="Submit"
    secondaryButtonText="Cancel"
    on:click:button--primary={submitBMHP}
    on:click:button--secondary={() => (openAddModal = false)}
  >
    <TextInput bind:value={inputBMHP} labelText="Nama BMHP" placeholder="Masukkan nama BMHP" />
    <TextInput bind:value={inputBMHPLabels} labelText="Labels" placeholder="pisahkan dengan koma ," />
  </Modal>
</PageShell>
