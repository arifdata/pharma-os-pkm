import * as z from "zod";

// Tambah Master BMHP Schema
const NamaMasterBMHPSchema = z.string().min(1, "Nama BMHP tidak boleh kosong");

const LabelMasterBMHPSchema = z.string();

export const MasterBMHPSchema = z.object({
	nama_bmhp: NamaMasterBMHPSchema,
	labels: LabelMasterBMHPSchema,
});

// Tambah Buku Penerimaan Gudang Validation Schema
const NomorSuratPenerimaanSchema = z.string().min(1, 'Isi nomor surat');

const SumberBarangPenerimaanSchema = z.string().min(1, 'Sumber harus diisi');

const TanggalPenerimaanSchema = z.string().date();

const ItemPenerimaanSchema = z.object({
	harga_satuan: z.number(),
	id_bmhp: z.string().min(1, 'Nama BMHP tidak valid'),
	jumlah: z.number(),
	labels: z.string(),
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
