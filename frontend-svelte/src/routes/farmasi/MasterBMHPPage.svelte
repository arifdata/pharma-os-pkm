<script>
  import { Tabs, Tab, TabContent, Column } from "carbon-components-svelte";
  import { Table, Settings } from "carbon-icons-svelte";

  import TabelMasterBMHP from "./master_bmhp/TabelMasterBMHP.svelte";

  import { getAuthState } from "../../pb/client.svelte";
  let auth = getAuthState();
</script>

{#if auth.isLoggedIn}
<Tabs fullWidth selected={0}>
  <Tab label="Master BMHP" icon={Table}/>
  <Tab label="Setting Variable" icon={Settings}/>
  <svelte:fragment slot="content">
    <TabContent>
        <TabelMasterBMHP />
    </TabContent>
    <TabContent>Content 2</TabContent>
  </svelte:fragment>
</Tabs>


{:else}
Belum login
{/if}

