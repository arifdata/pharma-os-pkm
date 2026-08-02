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
  import { Renew, Add } from "carbon-icons-svelte";

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
        labels: r.expand?.labels?.map((l) => l.label).join(", ") ?? "-",
        actions: r.id
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

  onMount(() => loadData().finally(() => (loading = false)));
</script>

{#if loading}
  <DataTableSkeleton columns={2} rows={5} headers={headers} />
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
  </DataTable>
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
