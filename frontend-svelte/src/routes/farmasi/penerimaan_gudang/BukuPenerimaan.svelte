<script>
  import { Box, Button, ButtonSet, TextInput } from "carbon-components-svelte";
  import { Add, Subtract, RenewAlt } from "carbon-icons-svelte";
  let items = $state([]);
  let no_surat = $state("");

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

{#snippet renderEl()}
  {#if items.length > 0}
    {#each items as item}
      <TextInput light labelText="User name" placeholder="Enter user name..." bind:value={item.nama} />
    {/each}
  {/if}
{/snippet}

<Box fill="field" padding={4} marginY={4}>
  <TextInput labelText="Nomor Surat" placeholder="Input nomor surat..." bind:value={no_surat}/>
  <br>
  <Button icon={RenewAlt} size="small" on:click={() => {
    const srt = generateNomorSurat();
    no_surat = srt;
  }}>Generate No.Surat</Button>
</Box>

<Box fill="field" padding={4} marginY={4}>
<ButtonSet>
  <Button icon={Add} on:click={() => {
    items.push({ "nama": "" });
  }} />
  <Button icon={Subtract} on:click={() => {
    items.pop();
  }} />
</ButtonSet>
</Box>

{@render renderEl()}
