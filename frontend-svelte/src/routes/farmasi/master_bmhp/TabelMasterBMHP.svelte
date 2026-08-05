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
  import { notif } from "../../../lib/notif.svelte";

  /** @type {any[]} */
  let allRows = $state([]);
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

  const headers = [
    { key: "nama_bmhp", value: "Nama BMHP", width: "50%"},
    { key: "labels", value: "Labels"},
    { key: "actions", value: "Actions" },
  ];

  let rows = $derived(
    searchTerm.trim() === ""
      ? allRows
      : allRows.filter((r) => {
          const q = searchTerm.toLowerCase();
          return (
            r.nama_bmhp.toLowerCase().includes(q) ||
            r.labels.toLowerCase().includes(q)
          );
        })
  );

  $effect(() => {
    rows;
    currentPage = 1;
  });

  async function loadData() {
    try {
      const records = await pb.collection("master_bmhp").getFullList({
        expand: "labels",
        sort: "created",
      });
      allRows = records.map((/** @type {any} */ r) => ({
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

  function clearFields() {
    inputBMHP = "";
    inputBMHPLabels = "";
  }

  /**
   * @param {string} item
   * @param {string} input_tags
   * @returns {Promise<{ok: boolean, msg: string}>}
   */
  async function addBMHP(item, input_tags) {
    if (item == "" || input_tags == "") {
      return {ok: false, msg: "Isian tidak boleh kosong"}
    }

    const current_labels = await pb.collection('master_bmhp_labels').getFullList();

    /** @type {Record<string, string>} */
    let map_labels = {};
    /** @type {string[]} */
    let relasi_labels = [];

    for (const label of current_labels) {
      map_labels[label['label']] = label['id'];
    }

    const arr_input_labels = input_tags.split(",");
    for (const input_label of arr_input_labels) {
      if (!Object.hasOwn(map_labels, input_label)) {
        const record = await pb.collection('master_bmhp_labels').create({ label: input_label });
        map_labels[input_label] = record['id'];
      }
      relasi_labels.push(map_labels[input_label]);
    }

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
    if (editBMHPName === "" || editBMHPLabels === "") {
      notif.add({
        kind: "error",
        subtitle: "Isian tidak boleh kosong",
        timeout: 3000,
      });
      return;
    }

    /** @type {Record<string, string>} */
    const mapLabels = {};
    /** @type {string[]} */
    const relasiLabels = [];

    const currentLabels = await pb.collection("master_bmhp_labels").getFullList();
    for (const label of currentLabels) {
      mapLabels[label["label"]] = label["id"];
    }

    const arrInputLabels = editBMHPLabels.split(",");
    for (const inputLabel of arrInputLabels) {
      if (!Object.hasOwn(mapLabels, inputLabel)) {
        const record = await pb.collection("master_bmhp_labels").create({ label: inputLabel });
        mapLabels[inputLabel] = record["id"];
      }
      relasiLabels.push(mapLabels[inputLabel]);
    }

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

{#if loading}
  <DataTableSkeleton columns={3} rows={5} headers={headers} />
{:else if error !== ""}
  <p class="error">{error}</p>
{:else}
  <DataTable
    title="Master BMHP"
    size="short"
    headers={headers}
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
  <Pagination
    bind:page={currentPage}
    bind:pageSize
    totalItems={rows.length}
    pageSizes={[5, 10, 20, 50]}
    size="sm"
  />
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
{/if}

<style>
  .error {
    color: var(--cds-text-error, #da1e28);
    padding: 1rem;
  }
</style>
