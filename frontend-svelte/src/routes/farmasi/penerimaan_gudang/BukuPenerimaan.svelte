<script>
  import { onMount } from "svelte";
  import {
    Box,
    Button,
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
  import { Add, Download, Edit, RenewAlt, TrashCan, Upload } from "carbon-icons-svelte";
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
  // Map tidak reaktif; counter ini memicu re-render saat cache nama berubah (mis. setelah import)
  let bmhpNamesVersion = $state(0);
  /** @type {HTMLInputElement|undefined} */
  let importFileInput;
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

  // --- riwayat nomor batch & tanggal expired per BMHP ---
  // Satu record di koleksi helper_data_penerimaan, bentuk data_penerimaan:
  // { "<id_bmhp>": ["<no_batch>", "<tgl_expired>"] }
  // Key = id master_bmhp (bukan nama) supaya riwayat tetap valid walau nama BMHP diubah.
  // Satu BMHP = satu pasangan; input baru menimpa pasangan lama.
  const HELPER_COLLECTION = "helper_data_penerimaan";
  /** @type {Record<string, [string, string]>} */
  let riwayatBatch = {};
  /** @type {string|null} */
  let helperRecordId = null;
  let helperLoaded = false;
  /** @type {Promise<void>|null} */
  let helperLoading = null;

  /**
   * Normalisasi satu value jadi pasangan [no_batch, tgl_expired].
   * Menerima bentuk array of pairs (data lama) dengan mengambil pasangan terakhir.
   * @param {unknown} value
   * @returns {[string, string]|null}
   */
  function normalizePair(value) {
    if (!Array.isArray(value)) return null;
    if (value.length === 2 && value.every((v) => typeof v === "string")) {
      return [String(value[0]), String(value[1])];
    }
    for (let i = value.length - 1; i >= 0; i--) {
      const pair = value[i];
      if (Array.isArray(pair) && pair.length >= 2) {
        return [String(pair[0] ?? ""), String(pair[1] ?? "")];
      }
    }
    return null;
  }

  /**
   * Terima bentuk lama/baru sekaligus: object map atau array of object
   * (mis. [{ "<id>": ["batch", "2027-01-01"] }]).
   * @param {unknown} raw @returns {Record<string, [string, string]>}
   */
  function normalizeRiwayat(raw) {
    /** @type {Record<string, [string, string]>} */
    const map = {};
    /** @param {string} key @param {unknown} value */
    const push = (key, value) => {
      const pair = normalizePair(value);
      if (pair) map[key] = pair;
    };
    if (Array.isArray(raw)) {
      for (const entry of raw) {
        if (!entry || typeof entry !== "object") continue;
        for (const [key, value] of Object.entries(entry)) push(key, value);
      }
    } else if (raw && typeof raw === "object") {
      for (const [key, value] of Object.entries(raw)) push(key, value);
    }
    return map;
  }

  async function loadRiwayatBatch() {
    if (helperLoaded) return;
    if (helperLoading) return helperLoading;
    helperLoading = (async () => {
      try {
        const records = await pb
          .collection(HELPER_COLLECTION)
          .getFullList({ sort: "created" });
        const record = records[0];
        if (record) {
          helperRecordId = record.id;
          riwayatBatch = normalizeRiwayat(record.data_penerimaan);
        }
        helperLoaded = true;
      } catch (e) {
        console.error("Gagal memuat riwayat batch:", e);
      } finally {
        helperLoading = null;
      }
    })();
    return helperLoading;
  }

  /**
   * Simpan data batch-expired untuk satu BMHP: pasangan lama ditimpa.
   * Bila no_batch dan tgl_expired dikosongkan, key BMHP dihapus (data lama dibuang).
   * @param {string} idBmhp
   * @param {string} noBatch
   * @param {string} tglExpired
   */
  async function simpanRiwayatBatch(idBmhp, noBatch, tglExpired) {
    if (!idBmhp) return;
    const batch = (noBatch ?? "").trim().toLowerCase();
    const expired = (tglExpired ?? "").trim();
    await loadRiwayatBatch();
    if (batch === "" && expired === "") {
      if (!Object.hasOwn(riwayatBatch, idBmhp)) return;
      delete riwayatBatch[idBmhp];
    } else {
      riwayatBatch[idBmhp] = [batch, expired];
    }
    try {
      if (helperRecordId) {
        try {
          await pb
            .collection(HELPER_COLLECTION)
            .update(helperRecordId, { data_penerimaan: riwayatBatch });
          return;
        } catch (e) {
          // Record bisa dihapus dari Admin UI saat halaman masih terbuka:
          // update balas 404. Buang id lama lalu buat record baru di bawah.
          if (/** @type {{status?: number}} */ (e)?.status !== 404) throw e;
          helperRecordId = null;
        }
      }
      const record = await pb
        .collection(HELPER_COLLECTION)
        .create({ data_penerimaan: riwayatBatch });
      helperRecordId = record.id;
    } catch (e) {
      console.error("Gagal menyimpan riwayat batch:", e);
      notif.add({
        kind: "error",
        title: "Gagal menyimpan riwayat batch/expired.",
        timeout: 3000,
      });
    }
  }

  /** @param {string} idBmhp */
  function isiRiwayatBatch(idBmhp) {
    const pair = riwayatBatch[idBmhp];
    if (!pair) return;
    const [batch, expired] = pair;
    draftItem.no_batch = batch;
    draftItem.tgl_expired = expired;
  }

  onMount(() => {
    void loadRiwayatBatch();
  });

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

  async function simpanItem() {
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
    await simpanRiwayatBatch(
      draftItem.id_bmhp,
      draftItem.no_batch,
      draftItem.tgl_expired,
    );
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
      bmhpNamesVersion++;
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
    void bmhpNamesVersion;
    return bmhpNames.get(id) ?? "(belum dipilih)";
  }

  /**
   * Ambil nama BMHP yang belum ada di cache (mis. setelah import draft).
   * @param {string[]} ids
   */
  async function loadBmhpNames(ids) {
    const missing = [...new Set(ids)].filter((id) => id && !bmhpNames.has(id));
    if (missing.length === 0) return;
    try {
      /** @type {Record<string,string>} */
      const params = {};
      const filter = missing
        .map((id, i) => {
          params[`id${i}`] = id;
          return `id = {:id${i}}`;
        })
        .join(" || ");
      const records = await pb.collection("master_bmhp").getFullList({
        filter: pb.filter(filter, params),
      });
      for (const r of records) bmhpNames.set(r.id, r.nama_bmhp);
      bmhpNamesVersion++;
    } catch (e) {
      console.error("Gagal fetch nama master_bmhp:", e);
    }
  }

  function exportDraft() {
    if (items.length === 0) {
      notif.add({
        kind: "warning",
        title: "Belum ada item untuk diexport.",
        timeout: 3000,
      });
      return;
    }
    const blob = new Blob([JSON.stringify(items, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const now = new Date();
    const pad = (/** @type {number} */ n) => String(n).padStart(2, "0");
    const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const link = document.createElement("a");
    link.href = url;
    link.download = `draft-penerimaan-${stamp}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    notif.add({
      kind: "success",
      title: `${items.length} item berhasil diexport.`,
      timeout: 3000,
    });
  }

  function openImportPicker() {
    importFileInput?.click();
  }

  /** @param {Event & { currentTarget: EventTarget & HTMLInputElement }} event */
  async function importDraft(event) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;

    /** @type {unknown} */
    let raw;
    try {
      raw = JSON.parse(await file.text());
    } catch {
      notif.add({ kind: "error", title: "File JSON tidak valid.", timeout: 3000 });
      return;
    }
    if (!Array.isArray(raw) || raw.length === 0) {
      notif.add({
        kind: "error",
        title: "File harus berisi array item yang tidak kosong.",
        timeout: 3000,
      });
      return;
    }

    /** @type {typeof items} */
    const restored = [];
    for (const [i, entry] of raw.entries()) {
      const parsed = ItemPenerimaanSchema.safeParse(entry);
      if (!parsed.success) {
        notif.add({
          kind: "error",
          title: `Item #${i + 1}: ${parsed.error.issues[0]?.message ?? "tidak valid"}`,
          timeout: 5000,
        });
        return;
      }
      restored.push({ ...parsed.data });
    }

    items = restored;
    await loadBmhpNames(restored.map((it) => it.id_bmhp));
    notif.add({
      kind: "success",
      title: `${restored.length} item berhasil diimpor.`,
      timeout: 3000,
    });
  }

  /** @param {string} id */
  function onBmhpSelect(id) {
    const selected = masterBMHP.find((m) => m.id === id);
    if (selected) {
      bmhpNames.set(selected.id, selected.name);
      bmhpNamesVersion++;
    }
    draftItem.id_bmhp = id;
    bmhpQuery = "";
    masterBMHP = [];
    // isi otomatis dari riwayat; kalau belum termuat, tunggu lalu isi
    // selama BMHP yang dipilih belum berubah.
    if (helperLoaded) {
      isiRiwayatBatch(id);
    } else {
      void loadRiwayatBatch().then(() => {
        if (draftItem.id_bmhp === id) isiRiwayatBatch(id);
      });
    }
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
  <input
    type="file"
    accept="application/json,.json"
    style="display: none;"
    bind:this={importFileInput}
    onchange={importDraft}
  />
  <div class="action-bar">
    <Button kind="tertiary" icon={Add} on:click={openAddItem}>Tambah Item</Button>
    <Button
      kind="ghost"
      icon={Download}
      disabled={items.length === 0}
      on:click={exportDraft}
    >
      Simpan Draft
    </Button>
    <Button kind="ghost" icon={Upload} on:click={openImportPicker}>Load Draft</Button>
    <div class="action-bar__primary">
      <Button
        kind="primary"
        disabled={items.length === 0}
        on:click={() => (confirmSubmitModal = true)}
      >
        Submit
      </Button>
    </div>
  </div>
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

  .action-bar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .action-bar__primary {
    margin-left: auto;
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
