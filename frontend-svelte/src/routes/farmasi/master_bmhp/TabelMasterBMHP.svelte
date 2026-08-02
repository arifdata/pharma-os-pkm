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
  } from "carbon-components-svelte";
  import { Renew, Add, TrashCan } from "carbon-icons-svelte";

  import { pb, addBMHP } from "../../../pb/client.svelte";
  import { notif } from "../../../lib/notif.svelte";

  let allRows = $state([]);
  let loading = $state(true);
  let error = $state(null);
  let searchTerm = $state("");
  let reloading = $state(false);
  let openAddModal = $state(false);
  let inputBMHP = $state("");
  let inputBMHPLabels = $state("");
  let openDeleteModal = $state(false);
  let deleteTargetId = $state("");

  const headers = [
    { key: "nama_bmhp", value: "Nama BMHP" },
    { key: "labels", value: "Labels" },
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

  async function loadData() {
    try {
      const records = await pb.collection("master_bmhp").getFullList({
        expand: "labels",
        sort: "created",
      });
      allRows = records.map((r) => ({
        id: r.id,
        nama_bmhp: r.nama_bmhp,
        labels: r.expand?.labels?.map((l) => l.label).join(",") ?? "-",
      }));
      error = null;
    } catch (e) {
      error = e.message ?? "Gagal memuat data";
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

  onMount(() => loadData().finally(() => (loading = false)));
</script>

{#if loading}
  <DataTableSkeleton columns={3} rows={5} headers={headers} />
{:else if error}
  <p class="error">{error}</p>
{:else}
  <DataTable
    title="Master BMHP"
    size="short"
    {headers}
    {rows}
    pageSize={10}
    zebra
  >
    <Toolbar>
      <ToolbarContent>
        <ToolbarSearch
          bind:value={searchTerm}
          on:clear={() => (searchTerm = "")}
        />
        <Button
          icon={Renew}
          disabled={reloading}
          on:click={reload}
          tooltip="Muat ulang data"
        >
          {reloading ? "Memuat..." : "Reload"}
        </Button>
        <Button icon={Add} onclick={() => (openAddModal = true)}>Tambah</Button>
      </ToolbarContent>
    </Toolbar>
    <svelte:fragment slot="cell" let:row let:cell>
      {#if cell.key === "actions"}
        <Button
          size="sm"
          kind="ghost"
          icon={TrashCan}
          hideTooltip={true}
          on:click={() => {
            deleteTargetId = row.id;
            openDeleteModal = true;
          }}
        />
      {:else}
        {cell.value}
      {/if}
    </svelte:fragment>
  </DataTable>
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
