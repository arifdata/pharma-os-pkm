<script>
  import { onMount } from "svelte";
  import {
    Button,
    DataTable,
    DataTableSkeleton,
    DatePicker,
    DatePickerInput,
    Modal,
    Pagination,
    TextInput,
    Toolbar,
    ToolbarContent,
    ToolbarSearch,
  } from "carbon-components-svelte";
  import { Renew, Add, TrashCan, Edit } from "carbon-icons-svelte";
  import { Indonesian } from "flatpickr/dist/l10n/id";

  import { pb } from "../../pb/client.svelte";
  import { notif } from "../../lib/notif.svelte";
  import { DataPasienSchema } from "../../validation-schema";

  /** @type {any[]} */
  let allRows = $state([]);
  let loading = $state(true);
  let error = $state("");
  let searchTerm = $state("");
  let reloading = $state(false);
  let currentPage = $state(1);
  let pageSize = $state(10);

  // --- tambah ---
  let openAddModal = $state(false);
  let inputNomorKartu = $state("");
  let inputNamaPasien = $state("");
  let inputAlamat = $state("");
  let inputTanggalLahir = $state("");
  let inputNomorTelepon = $state("");

  // --- edit ---
  let openEditModal = $state(false);
  let editTargetId = $state("");
  let editNomorKartu = $state("");
  let editNamaPasien = $state("");
  let editAlamat = $state("");
  let editTanggalLahir = $state("");
  let editNomorTelepon = $state("");

  // --- hapus ---
  let openDeleteModal = $state(false);
  let deleteTargetId = $state("");
  let deleteTargetName = $state("");

  const headers = [
    { key: "nomor_kartu", value: "No. Kartu" },
    { key: "nama_pasien", value: "Nama Pasien", width: "25%" },
    { key: "alamat", value: "Alamat", width: "25%" },
    { key: "tanggal_lahir", value: "Tanggal Lahir" },
    { key: "umur", value: "Umur" },
    { key: "nomor_telepon", value: "No. Telepon" },
    { key: "actions", value: "Actions" },
  ];

  let rows = $derived(
    searchTerm.trim() === ""
      ? allRows
      : allRows.filter((r) => {
          const q = searchTerm.toLowerCase();
          return (
            String(r.nomor_kartu ?? "").toLowerCase().includes(q) ||
            String(r.nama_pasien ?? "").toLowerCase().includes(q)
          );
        })
  );

  $effect(() => {
    rows;
    currentPage = 1;
  });

  /** @param {any} value */
  function toDateInput(value) {
    if (!value) return "";
    return String(value).slice(0, 10);
  }

  /**
   * Selisih bulan penuh antara tanggal lahir dan sekarang, format "XX Tahun XX Bulan".
   * @param {string} tanggalLahir format YYYY-MM-DD
   * @returns {string}
   */
  function hitungUmur(tanggalLahir) {
    if (!tanggalLahir) return "-";
    const lahir = new Date(`${toDateInput(tanggalLahir)}T00:00:00`);
    if (Number.isNaN(lahir.getTime())) return "-";

    const now = new Date();
    let totalBulan =
      (now.getFullYear() - lahir.getFullYear()) * 12 +
      (now.getMonth() - lahir.getMonth());
    // bulan berjalan belum penuh kalau tanggal sekarang < tanggal lahir
    if (now.getDate() < lahir.getDate()) totalBulan -= 1;
    if (totalBulan < 0) totalBulan = 0;

    const tahun = Math.floor(totalBulan / 12);
    const bulan = totalBulan % 12;
    return `${tahun} Tahun ${bulan} Bulan`;
  }

  async function loadData() {
    try {
      const records = await pb.collection("data_pasien").getFullList({
        sort: "nama_pasien",
      });
      allRows = records.map((/** @type {any} */ r) => ({
        id: r.id,
        nomor_kartu: r.nomor_kartu,
        nama_pasien: r.nama_pasien,
        alamat: r.alamat,
        tanggal_lahir: toDateInput(r.tanggal_lahir),
        umur: hitungUmur(r.tanggal_lahir),
        nomor_telepon: r.nomor_telepon ?? "",
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

  function clearAddFields() {
    inputNomorKartu = "";
    inputNamaPasien = "";
    inputAlamat = "";
    inputTanggalLahir = "";
    inputNomorTelepon = "";
  }

  function closeAddModal() {
    openAddModal = false;
    clearAddFields();
  }

  /**
   * @param {any} data
   * @returns {{ok: true, data: any} | {ok: false, message: string}}
   */
  function validate(data) {
    const parsed = DataPasienSchema.safeParse(data);
    if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };
    return { ok: true, data: parsed.data };
  }

  async function submitAdd() {
    const result = validate({
      nomor_kartu: inputNomorKartu,
      nama_pasien: inputNamaPasien,
      alamat: inputAlamat,
      tanggal_lahir: inputTanggalLahir,
      nomor_telepon: inputNomorTelepon,
    });
    if (!result.ok) {
      notify("error", result.message);
      return;
    }

    try {
      const record = await pb.collection("data_pasien").create(result.data);
      closeAddModal();
      notify("success", `Menambahkan ${record["nama_pasien"]}`);
      await reload();
    } catch (e) {
      notify("error", /** @type {Error} */ (e).message ?? "Gagal menambah data");
    }
  }

  /** @param {any} row */
  function openEdit(row) {
    editTargetId = row.id;
    editNomorKartu = row.nomor_kartu;
    editNamaPasien = row.nama_pasien;
    editAlamat = row.alamat;
    editTanggalLahir = row.tanggal_lahir;
    editNomorTelepon = row.nomor_telepon;
    openEditModal = true;
  }

  async function submitEdit() {
    const result = validate({
      nomor_kartu: editNomorKartu,
      nama_pasien: editNamaPasien,
      alamat: editAlamat,
      tanggal_lahir: editTanggalLahir,
      nomor_telepon: editNomorTelepon,
    });
    if (!result.ok) {
      notify("error", result.message);
      return;
    }

    try {
      await pb.collection("data_pasien").update(editTargetId, result.data);
      openEditModal = false;
      notify("success", "Data pasien berhasil diperbarui");
      await reload();
    } catch (e) {
      notify("error", /** @type {Error} */ (e).message ?? "Gagal memperbarui data");
    }
  }

  /** @param {any} row */
  function openDelete(row) {
    deleteTargetId = row.id;
    deleteTargetName = row.nama_pasien;
    openDeleteModal = true;
  }

  async function submitDelete() {
    if (!deleteTargetId) {
      notify("error", "Target hapus tidak valid");
      return;
    }
    try {
      await pb.collection("data_pasien").delete(deleteTargetId);
      openDeleteModal = false;
      deleteTargetId = "";
      deleteTargetName = "";
      notify("success", "Data pasien berhasil dihapus");
      await reload();
    } catch (e) {
      notify("error", /** @type {Error} */ (e).message ?? "Gagal menghapus data");
    }
  }

  onMount(() => loadData().finally(() => (loading = false)));
</script>

{#if loading}
  <DataTableSkeleton columns={7} rows={5} headers={headers} />
{:else if error !== ""}
  <p class="error">{error}</p>
{:else}
  <DataTable
    title="Data Pasien"
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
          placeholder="Cari nama pasien atau no. kartu"
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
          iconDescription="Tambah Pasien"
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
          iconDescription={`Edit ${row.nama_pasien}`}
          tooltipPosition="left"
          on:click={() => openEdit(row)}
        />
        <Button
          size="small"
          kind="ghost"
          icon={TrashCan}
          iconDescription={`Hapus ${row.nama_pasien}`}
          tooltipPosition="right"
          on:click={() => openDelete(row)}
        />
      {:else if cell.key === "nama_pasien" || cell.key === "alamat"}
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
      bind:value={inputNomorKartu}
      labelText="Nomor Kartu"
      placeholder="Masukkan nomor kartu"
    />
    <TextInput
      bind:value={inputNamaPasien}
      labelText="Nama Pasien"
      placeholder="Masukkan nama pasien"
    />
    <TextInput
      bind:value={inputAlamat}
      labelText="Alamat"
      placeholder="Masukkan alamat"
    />
    <DatePicker
      datePickerType="single"
      locale={Indonesian}
      dateFormat="Y-m-d"
      on:change
      bind:value={inputTanggalLahir}
    >
      <DatePickerInput labelText="Tanggal Lahir" placeholder="yyyy-mm-dd" />
    </DatePicker>
    <TextInput
      bind:value={inputNomorTelepon}
      labelText="Nomor Telepon (opsional)"
      placeholder="Masukkan nomor telepon"
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
      bind:value={editNomorKartu}
      labelText="Nomor Kartu"
      placeholder="Masukkan nomor kartu"
    />
    <TextInput
      bind:value={editNamaPasien}
      labelText="Nama Pasien"
      placeholder="Masukkan nama pasien"
    />
    <TextInput
      bind:value={editAlamat}
      labelText="Alamat"
      placeholder="Masukkan alamat"
    />
    <DatePicker
      datePickerType="single"
      locale={Indonesian}
      dateFormat="Y-m-d"
      on:change
      bind:value={editTanggalLahir}
    >
      <DatePickerInput labelText="Tanggal Lahir" placeholder="yyyy-mm-dd" />
    </DatePicker>
    <TextInput
      bind:value={editNomorTelepon}
      labelText="Nomor Telepon (opsional)"
      placeholder="Masukkan nomor telepon"
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
    <p>Apakah Anda yakin ingin menghapus pasien "{deleteTargetName}"?</p>
  </Modal>
{/if}

<style>
  .error {
    color: var(--cds-text-error, #da1e28);
    padding: 1rem;
  }
</style>
