
<script>
  import BukuPenerimaan from "./BukuPenerimaan.svelte";
  import { getAuthState } from "../../../pb/client.svelte";
  let auth = getAuthState();
</script>

{#if auth.isLoggedIn}
  <BukuPenerimaan />
{:else}
  Belum login
{/if}
