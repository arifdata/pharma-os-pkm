<script>
  import { Tabs, Tab, TabContent, Column } from "carbon-components-svelte";
  import { Table, Settings } from "carbon-icons-svelte";

  import TabelMasterBMHP from "./master_bmhp/TabelMasterBMHP.svelte";
</script>

<!-- <h4>Master BMHP</h4> -->

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

