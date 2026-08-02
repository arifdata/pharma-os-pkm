<script>
  import TabelMasterBMHP from "./master_bmhp/TabelMasterBMHP.svelte";
  import { getAuthState } from "../../pb/client.svelte";

  let auth = getAuthState();
</script>

{#if auth.isLoggedIn}
  <TabelMasterBMHP />
{:else}
  Belum login
{/if}
