import * as z from "zod";

const NomorSuratPenerimaanSchema = z.string();

const SumberBarangPenerimaanSchema = z.string();

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

