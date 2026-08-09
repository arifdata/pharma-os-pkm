<script>
  import { onMount } from "svelte";
  import {
    Box,
    Button,
    ButtonSet,
    TextInput,
    DatePicker,
    DatePickerInput,
    SearchMenu,
    SearchMenuItem,
  } from "carbon-components-svelte";
  import { Indonesian } from "flatpickr/dist/l10n/id";
  import { Add, Subtract, RenewAlt } from "carbon-icons-svelte";
  import { pb } from "../../../pb/client.svelte";

  /** @type {{id_bmhp:string}[]} */
  let items = $state([]);
  $inspect(items);
  let nomorSurat = $state("");
  let sumberBarang = $state("");
  let tanggalTerima = $state("");
  /** @type {{id:string, name:string}[]} */
  let masterBMHP = $state([]);

  async function fetchMasterBMHP() {
    try {
      const records = await pb.collection("master_bmhp").getFullList({
        sort: "nama_bmhp",
      });
      masterBMHP = records.map((r) => ({
        id: r.id,
        name: r.nama_bmhp,
      }));
    } catch (e) {
      console.error("Gagal fetch master_bmhp:", e);
    }
  }

  onMount(() => {
    fetchMasterBMHP();
  });

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

<!-- {@debug masterBMHP} -->

{#snippet renderEl()}
  {#if items.length > 0}
    <Box fill="field" padding={4} marginY={4}>
      {#each items as item, idx (idx)}
        {@const selectedName = masterBMHP.find(m => m.id === item.id_bmhp)?.name ?? ''}
        <SearchMenu
          labelText="Search"
          placeholder="Search..."
          value={selectedName}
          on:select={(e) => {
            item.id_bmhp = e.detail.value;
          }}
          on:clear={() => {
            item.id_bmhp = '';
          }}
        >
          {#each masterBMHP as bmhp (bmhp.id)}
            <SearchMenuItem
              text={bmhp.name}
              value={bmhp.id}
            />
          {/each}
        </SearchMenu>
        <!-- <TextInput light labelText="User name" placeholder="Enter user name..." bind:value={item.id_bmhp} /> -->
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

{@render renderEl()}

<Box fill="field" padding={4} marginY={4}>
<ButtonSet>
  <Button icon={Add} on:click={() => {
    items.push({ "id_bmhp": "" });
  }} />
  <Button icon={Subtract} on:click={() => {
    items.pop();
  }} />
</ButtonSet>
</Box>

