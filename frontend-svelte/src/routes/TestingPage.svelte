
<script>
  import { Column } from "carbon-components-svelte";
  import { getAuthState } from "../pb/client.svelte";
  let auth = getAuthState();

</script>

{#if auth.isLoggedIn}
<Column>
  Other Page
</Column>
{:else}
Belum login
{/if}