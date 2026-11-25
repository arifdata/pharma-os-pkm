import * as z from "zod";

// Tambah Master BMHP Schema
const NamaMasterBMHPSchema = z.string().min(1, "Nama BMHP tidak boleh kosong");

const LabelMasterBMHPSchema = z.string().toLowerCase().trim().transform((val) => val.replaceAll(" ", "-"));

export const MasterBMHPSchema = z.object({
	nama_bmhp: NamaMasterBMHPSchema,
	labels: LabelMasterBMHPSchema,
});

// Tambah Subunit Validation Schema
export const SubunitSchema = z.object({
	subunit: z.string().trim().min(1, "Nama subunit tidak boleh kosong"),
});

// Tambah Buku Penerimaan Gudang Validation Schema
const NomorSuratPenerimaanSchema = z.string().min(1, 'Isi nomor surat');

const SumberBarangPenerimaanSchema = z.string().min(1, 'Sumber harus diisi');

const TanggalPenerimaanSchema = z.string().date();

export const ItemPenerimaanSchema = z.object({
	harga_satuan: z.number(),
	id_bmhp: z.string().min(1, 'Nama BMHP tidak valid'),
	jumlah: z.number(),
	labels: z.string().toLowerCase().trim(),
	no_batch: z.string(),
	tgl_expired: z.union([z.string(), z.string().date()]),
});

const DaftarItemPenerimaanSchema = z.array(ItemPenerimaanSchema);

export const TambahBukuPenerimaanSchema = z.object({
	no_surat: NomorSuratPenerimaanSchema,
	sumber: SumberBarangPenerimaanSchema,
	tgl_terima: TanggalPenerimaanSchema,
	daftar_item: DaftarItemPenerimaanSchema,
});

// Distribusi Gudang Validation Schema
export const DistribusiItemSchema = z.object({
	tujuan: z.string().min(1, "Subunit tujuan tidak valid"),
	jumlah: z.number().int().min(1, "Jumlah minimal 1"),
	tanggal_distribusi: TanggalPenerimaanSchema,
});

// Data Pasien Validation Schema — semua field teks disimpan lowercase
export const DataPasienSchema = z.object({
	nomor_kartu: z.string().trim().toLowerCase().min(1, "Nomor kartu tidak boleh kosong"),
	nama_pasien: z.string().trim().toLowerCase().min(1, "Nama pasien tidak boleh kosong"),
	alamat: z.string().trim().toLowerCase().min(1, "Alamat tidak boleh kosong"),
	tanggal_lahir: z
		.string()
		.min(1, "Tanggal lahir tidak boleh kosong")
		.refine((val) => !Number.isNaN(Date.parse(val)), "Tanggal lahir tidak valid"),
	nomor_telepon: z.string().trim().toLowerCase().optional(),
});

// Data Peresep Validation Schema — nama peresep disimpan lowercase
export const DataPeresepSchema = z.object({
	nama_peresep: z.string().trim().toLowerCase().min(1, "Nama peresep tidak boleh kosong"),
});
