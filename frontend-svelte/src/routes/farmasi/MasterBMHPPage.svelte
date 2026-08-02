<script>
  import { Tabs, Tab, TabContent } from "carbon-components-svelte";
  import { Table, Settings } from "carbon-icons-svelte";

  import TabelMasterBMHP from "./master_bmhp/TabelMasterBMHP.svelte";

  import { getAuthState } from "../../pb/client.svelte";

  let auth = getAuthState();
</script>

{#if auth.isLoggedIn}
  <Tabs fullWidth selected={0}>
    <Tab label="Master BMHP" icon={Table} />
    <Tab label="Tab 2" icon={Settings} />
    <svelte:fragment slot="content">
      <TabContent>
        <TabelMasterBMHP />
      </TabContent>
      <TabContent>
        <p>Tab 2 content</p>
      </TabContent>
    </svelte:fragment>
  </Tabs>
{:else}
  Belum login
{/if}