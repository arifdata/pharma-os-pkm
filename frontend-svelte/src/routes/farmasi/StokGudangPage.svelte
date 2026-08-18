<script>
  import { pb } from "../../pb/client.svelte";

  async function loadData() {
	  const records = await pb.collection('stok_gudang').getFullList({
      filter: 'jumlah > 0',
      expand: 'item,item.nama_bmhp',
    });
	  return records;
  }

  let x = loadData();
  console.log(x);
</script>

{#await x}
  ...
{:then data}
  {#each data as item}
    {item.expand.item.expand.nama_bmhp.nama_bmhp}: {item.jumlah}<br>
  {/each}
{/await}
