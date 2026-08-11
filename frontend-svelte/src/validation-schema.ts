import * as z from "zod";

const ItemPenerimaanSchema = z.object({
	harga_satuan: z.number(),
	id_bmhp: z.string().min(1, 'barang tidak boleh kosong'),
	jumlah: z.number(),
	labels: z.string(),
	no_batch: z.string(),
	tgl_expired: z.string(),
});

const DaftarItemPenerimaanSchema = z.array(ItemPenerimaanSchema);
