<script>
  import { Button, ButtonSet, TextInput } from "carbon-components-svelte";
  let items = $state([]);
</script>

{#snippet renderEl()}
  {#if items.length > 0}
    {#each items as item}
      <TextInput light labelText="User name" placeholder="Enter user name..." bind:value={item.nama} />
    {/each}
  {/if}
{/snippet}

<ButtonSet>
  <Button on:click={() => {
    items.push({ "nama": "" });
  }}>Add</Button>
  <Button on:click={() => {
    items.pop();
  }}>Sub</Button>
</ButtonSet>

{@render renderEl()}
