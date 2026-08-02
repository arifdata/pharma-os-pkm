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
  let openModal = $state(false);
  let inputBMHP = $state("");
  let inputBMHPTags = $state("");

  const headers = [
    { key: "nama_bmhp", value: "Nama BMHP" },
    { key: "tags", value: "Tags" },
  ];

  let rows = $derived(
    searchTerm.trim() === ""
      ? allRows
      : allRows.filter((r) => {
          const q = searchTerm.toLowerCase();
          return (
            r.nama_bmhp.toLowerCase().includes(q) ||
            r.tags.toLowerCase().includes(q)
          );
        })
  );

  async function loadData() {
    try {
      const records = await pb.collection("master_bmhp").getFullList({
        expand: "tags",
        sort: "created",
      });
      allRows = records.map((r) => ({
        id: r.id,
        nama_bmhp: r.nama_bmhp,
        tags: r.expand?.tags?.map((t) => t.tag).join(", ") ?? "-",
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
    inputBMHPTags = "";
  }

  async function submitBMHP() {
    let resp = await addBMHP(inputBMHP, inputBMHPTags);
    openModal = false;
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
        <Button icon={Add} onclick={() => (openModal = true)}>Tambah</Button>
      </ToolbarContent>
    </Toolbar>
  </DataTable>
  <Modal
    bind:open={openModal}
    primaryButtonText="Submit"
    secondaryButtonText="Cancel"
    on:click:button--primary={submitBMHP}
    on:click:button--secondary={() => (openModal = false)}
  >
    <TextInput bind:value={inputBMHP} labelText="Nama BMHP" placeholder="Masukkan nama BMHP" />
    <TextInput bind:value={inputBMHPTags} labelText="Tags" placeholder="pisahkan dengan koma ," />
  </Modal>
{/if}

<style>
  .error {
    color: var(--cds-text-error, #da1e28);
    padding: 1rem;
  }
</style>
