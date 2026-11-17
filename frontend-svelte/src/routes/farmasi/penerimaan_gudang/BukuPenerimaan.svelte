<script>
  import {
    Box,
    Button,
    ButtonSet,
    TextInput,
    DatePicker,
    DatePickerInput,
    SearchMenu,
    SearchMenuItem,
    NumberInput,
    Text,
    Modal,
    Loading
  } from "carbon-components-svelte";
  import { Indonesian } from "flatpickr/dist/l10n/id";
  import { Add, Edit, RenewAlt, TrashCan } from "carbon-icons-svelte";
  import { pb } from "../../../pb/client.svelte";
  import { notif } from "../../../lib/notif.svelte";
  import {
    TambahBukuPenerimaanSchema,
    ItemPenerimaanSchema,
  } from "../../../validation-schema";

  /** @type {{id_bmhp:string,jumlah:number,no_batch:string,tgl_expired:string,harga_satuan:number,labels:string}[]} */
  let items = $state([]);
  let nomorSurat = $state("");
  let sumberBarang = $state("");
  let tanggalTerima = $state("");
  /** @type {{id:string, name:string}[]} */
  let masterBMHP = $state([]);
  // saran BMHP hanya diambil saat user mengetik (server-side search)
  let bmhpQuery = $state("");
  let bmhpLoading = $state(false);
  /** @type {ReturnType<typeof setTimeout>|undefined} */
  let bmhpDebounce;
  let bmhpRequestId = 0;
  /** @type {Map<string,string>} cache id -> nama, dipakai untuk menampilkan item terpilih */
  const bmhpNames = new Map();
  let confirmSubmitModal = $state(false);
  let isLoading = $state(false);

  // --- modal tambah/edit item ---
  const emptyItem = () => ({
    id_bmhp: "",
    jumlah: 1,
    no_batch: "",
    tgl_expired: "",
    harga_satuan: 0,
    labels: "",
  });
  let itemModalOpen = $state(false);
  /** @type {number|null} null = tambah baru, number = index edit */
  let editingIndex = $state(null);
  let draftItem = $state(emptyItem());

  function openAddItem() {
    editingIndex = null;
    draftItem = emptyItem();
    masterBMHP = [];
    bmhpQuery = "";
    itemModalOpen = true;
  }

  /** @param {number} idx */
  function openEditItem(idx) {
    editingIndex = idx;
    draftItem = { ...items[idx] };
    masterBMHP = [];
    bmhpQuery = "";
    itemModalOpen = true;
  }

  function simpanItem() {
    const parsed = ItemPenerimaanSchema.safeParse(draftItem);
    if (!parsed.success) {
      for (const err of parsed.error.issues) {
        notif.add({ kind: "error", title: err.message, timeout: 3000 });
      }
      return;
    }
    if (editingIndex === null) {
      items.push({ ...draftItem });
    } else {
      items[editingIndex] = { ...draftItem };
    }
    itemModalOpen = false;
  }

  /** @param {string} query */
  async function fetchMasterBMHP(query) {
    const q = query.trim();
    const requestId = ++bmhpRequestId;
    if (q === "") {
      masterBMHP = [];
      bmhpLoading = false;
      return;
    }
    bmhpLoading = true;
    try {
      const records = await pb.collection("master_bmhp").getList(1, 20, {
        filter: pb.filter("nama_bmhp ~ {:q}", { q }),
        sort: "nama_bmhp",
      });
      if (requestId !== bmhpRequestId) return;
      masterBMHP = records.items.map((r) => {
        bmhpNames.set(r.id, r.nama_bmhp);
        return { id: r.id, name: r.nama_bmhp };
      });
    } catch (e) {
      console.error("Gagal fetch master_bmhp:", e);
    } finally {
      if (requestId === bmhpRequestId) bmhpLoading = false;
    }
  }

  /** @param {string} query */
  function onBmhpSearch(query) {
    bmhpQuery = query;
    clearTimeout(bmhpDebounce);
    bmhpDebounce = setTimeout(() => fetchMasterBMHP(query), 250);
  }

  /** @param {string} id */
  function namaBMHP(id) {
    return bmhpNames.get(id) ?? "(belum dipilih)";
  }

  /** @param {string} id */
  function onBmhpSelect(id) {
    const selected = masterBMHP.find((m) => m.id === id);
    if (selected) bmhpNames.set(selected.id, selected.name);
    draftItem.id_bmhp = id;
    bmhpQuery = "";
    masterBMHP = [];
  }

  function submitPenerimaan(){
    const formData = {
      no_surat: nomorSurat,
      sumber: sumberBarang,
      tgl_terima: tanggalTerima,
      daftar_item: items,

    };
    const submit = TambahBukuPenerimaanSchema.safeParse(formData);
    if (!submit.success) {
      for (const err of submit.error.issues) {
        notif.add({
          kind: "error",
          title: err.message,
          timeout: 3000,
        });
      }
    } else {
      prosesPenerimaan(submit.data);
    }
  }

  /** @param {import("zod").infer<typeof TambahBukuPenerimaanSchema>} data */
  async function prosesPenerimaan(data) {
    isLoading = true;
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      /** @type {Record<string, string>} */
      const mapLabels = {};
      /** @type {string[]} */
      const relasiLabels = [];

      const currentLabels = await pb.collection("penerimaan_gudang_labels").getFullList();
      for (const label of currentLabels) {
        mapLabels[label["label"]] = label["id"];
      }

      for (const labels of data['daftar_item']) {
        const arrInputLabels = labels['labels'].split(",");
        for (const inputLabel of arrInputLabels) {
          if (!Object.hasOwn(mapLabels, inputLabel)) {
            const record = await pb.collection("penerimaan_gudang_labels").create({ label: inputLabel });
            mapLabels[inputLabel] = record["id"];
          }
          relasiLabels.push(mapLabels[inputLabel]);
        }
      }

      const penerimaanGudangBody = {
        "tanggal_terima": `${data['tgl_terima']} 00:00:00.000Z`,
        "nomor_surat": data['no_surat'],
        "sumber": data['sumber']
      };
      const newPenerimaanGudang = await pb.collection('penerimaan_gudang').create(penerimaanGudangBody);
      const idPenerimaanGudang = newPenerimaanGudang['id'];

      for (const item of data['daftar_item']) {

        const itemLabels = [];
        const splitLabels = item['labels'].split(",");
        for (const label of splitLabels) {
          itemLabels.push(mapLabels[label]);
        }

        const penerimaanGudangItemsBody = {
          "penerimaan_gudang": idPenerimaanGudang,
          "nama_bmhp": item['id_bmhp'],
          "harga_satuan": item['harga_satuan'],
          "jumlah": item['jumlah'],
          "no_batch": item['no_batch'],
          "tanggal_expired": item['tgl_expired'] === "" ? "" : `${item['tgl_expired']} 00:00:00.000Z`,
          "labels": itemLabels
        };

        const newPenerimaanGudangItem = await pb.collection('penerimaan_gudang_items').create(penerimaanGudangItemsBody);

        const inputStokPenerimaanGudang = {
          id: newPenerimaanGudangItem['id'],
          jumlah: newPenerimaanGudangItem['jumlah']
        }

        const createStokGudangBody = {
          "item": inputStokPenerimaanGudang['id'],
          "jumlah": inputStokPenerimaanGudang['jumlah']
        };

        const newCreateStokGudang = await pb.collection('stok_gudang').create(createStokGudangBody);

      }

      notif.add({
        kind: "success",
        title: "Item berhasil terinput.",
        timeout: 3000,
      });

    } finally {
      items = [];
      nomorSurat = "";
      sumberBarang = "";
      tanggalTerima = "";
      isLoading = false;
    }
  }

  function generateNomorSurat() {
    const date = new Date();
    const monthNum = String(date.getMonth() + 1).padStart(2, '0');
    const yearNum = date.getFullYear();

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let randomString = '';
    for (let i = 0; i < 6; i++) {
      randomString += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const generated = `${monthNum}/${randomString}/${yearNum}`
    return generated
  }

</script>

<Loading bind:active={isLoading} />

{#snippet renderDaftarItems()}
  {#if items.length > 0}
    <Box fill="layer-01" padding={4} marginY={4}>
      <Text>Daftar Items:</Text>
      {#each items as item, idx (idx)}
        <Box fill="layer-02" padding={4} marginY={4} style="position: relative;">
          <Button
            style="position: absolute; top: 0.5rem; right: 0.5rem; z-index: 1;"
            kind="ghost"
            size="small"
            iconDescription="Hapus item"
            tooltipPosition="left"
            icon={TrashCan}
            on:click={() => (items.splice(idx, 1))}
          />
          <Button
            style="position: absolute; top: 0.5rem; right: 2.75rem; z-index: 1;"
            kind="ghost"
            size="small"
            iconDescription="Edit item"
            tooltipPosition="left"
            icon={Edit}
            on:click={() => openEditItem(idx)}
          />
          <div class="item-summary">
            <div class="item-title">{idx + 1}. {namaBMHP(item.id_bmhp)}</div>
            <div class="item-meta">
              <span>Jumlah: {item.jumlah}</span>
              <span>Batch: {item.no_batch || "-"}</span>
              <span>Exp: {item.tgl_expired || "-"}</span>
              <span>Harga: Rp. {item.harga_satuan}</span>
              <span>Labels: {item.labels || "-"}</span>
            </div>
          </div>
        </Box>
      {/each}
    </Box>
  {/if}
{/snippet}

<Box fill="field" padding={4} marginY={4}>
  <TextInput labelText="Nomor Surat" placeholder="Input nomor surat..." bind:value={nomorSurat}/>
  <br>
  <Button kind="tertiary" icon={RenewAlt} size="small" on:click={() => {
    const srt = generateNomorSurat();
    nomorSurat = srt;
  }}>Generate No.Surat</Button>
</Box>

<Box fill="field" padding={4} marginY={4}>
  <TextInput labelText="Sumber Barang" placeholder="Input sumber barang..." bind:value={sumberBarang}/>
</Box>


<Box fill="field" padding={4} marginY={4}>
  <DatePicker datePickerType="single" locale={Indonesian} dateFormat="Y-m-d" on:change bind:value={tanggalTerima}>
    <DatePickerInput labelText="Tanggal Terima" placeholder="yyyy-mm-dd" />
  </DatePicker>
</Box>

{@render renderDaftarItems()}

<Box fill="field" padding={4} marginY={4}>
  <ButtonSet>
    <Button icon={Add} iconDescription="Tambah item" tooltipPosition="right" on:click={openAddItem} />
    {#if (items.length > 0)}
      <Button kind="primary" on:click={() => (confirmSubmitModal = true)}>Submit</Button>
    {:else}
      <Button kind="primary" disabled>Submit</Button>
    {/if}
  </ButtonSet>
</Box>

<Modal
  size="lg"
  bind:open={itemModalOpen}
  primaryButtonText={editingIndex === null ? "Tambah Item" : "Simpan Item"}
  secondaryButtonText="Batal"
  on:click:button--primary={simpanItem}
  on:click:button--secondary={() => (itemModalOpen = false)}
>
  <div class="item-modal-form">
    <div>
      <div class="field-label">Nama BMHP</div>
      <SearchMenu
        placeholder="Ketik untuk cari Nama BMHP..."
        size="sm"
        value={bmhpQuery}
        shouldFilter={false}
        loading={bmhpLoading}
        on:input={(/** @type {any} */ e) => onBmhpSearch(e.target?.value ?? "")}
        on:select={(e) => onBmhpSelect(e.detail.value)}
        on:clear={() => onBmhpSearch("")}
      >
        {#each masterBMHP as bmhp (bmhp.id)}
          <SearchMenuItem text={bmhp.name} value={bmhp.id} />
        {/each}
        <div slot="noResults" class="suggestion-hint">Ketik nama BMHP untuk mencari</div>
      </SearchMenu>
      {#if draftItem.id_bmhp}
        <Text size="sm">Dipilih: {namaBMHP(draftItem.id_bmhp)}</Text>
      {/if}
    </div>
    <NumberInput
      labelText="Jumlah"
      size="sm"
      bind:value={draftItem.jumlah}
      min={1}
      invalidText="Tidak bisa di bawah 1"
    />
    <TextInput labelText="Nomor Batch" size="sm" bind:value={draftItem.no_batch} />
    <DatePicker
      datePickerType="single"
      locale={Indonesian}
      dateFormat="Y-m-d"
      on:change
      bind:value={draftItem.tgl_expired}
    >
      <DatePickerInput labelText="Tanggal Expired" placeholder="yyyy-mm-dd" />
    </DatePicker>
    <NumberInput
      labelText="Harga Satuan (Rp.)"
      size="sm"
      bind:value={draftItem.harga_satuan}
      min={0}
      step={0.5}
      invalidText="Tidak bisa di bawah 0"
    />
    <TextInput
      labelText="Labels"
      placeholder="pisahkan dengan koma ,"
      size="sm"
      bind:value={draftItem.labels}
    />
  </div>
</Modal>

<Modal
  size="xs"
  bind:open={confirmSubmitModal}
  primaryButtonText="Confirm"
  secondaryButtonText="Cancel"
  on:click:button--primary={() => {
    submitPenerimaan();
    confirmSubmitModal = false;
  }}
  on:click:button--secondary={() => (confirmSubmitModal = false)}
>
  <p>Lanjut memproses {items.length} item?</p>
</Modal>

<style>
  .item-modal-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .field-label {
    font-size: 0.75rem;
    line-height: 1rem;
    letter-spacing: 0.32px;
    color: var(--cds-text-secondary, #525252);
    margin-bottom: 0.5rem;
  }

  .suggestion-hint {
    padding: 0.5rem 1rem;
    font-size: 0.75rem;
    color: var(--cds-text-secondary, #525252);
  }

  .item-summary {
    padding-right: 6rem;
  }

  .item-title {
    font-size: 0.875rem;
    font-weight: 600;
    line-height: 1.25rem;
    color: var(--cds-text-primary, #161616);
    margin-bottom: 0.5rem;
  }

  .item-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 1.5rem;
    font-size: 0.75rem;
    line-height: 1rem;
    color: var(--cds-text-secondary, #525252);
  }
</style>
