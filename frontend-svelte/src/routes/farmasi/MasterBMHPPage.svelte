<script>
  import { Tabs, Tab, TabContent, Column, Button, Modal, TextInput } from "carbon-components-svelte";
  import { Table, Settings } from "carbon-icons-svelte";

  import TabelMasterBMHP from "./master_bmhp/TabelMasterBMHP.svelte";

  import { getAuthState, addBMHP } from "../../pb/client.svelte";
  import { notif } from "../../lib/notif.svelte";
  let auth = getAuthState();
  let openModal = $state(false);
  let inputBMHP = $state("");
  let inputBMHPTags = $state("");

  function clearFields() {
    inputBMHP = "";
    inputBMHPTags = "";
  };
</script>

{#if auth.isLoggedIn}
<Tabs fullWidth selected={0}>
  <Tab label="Master BMHP" icon={Table}/>
  <Tab label="Tab 2" icon={Settings}/>
  <svelte:fragment slot="content">
    <TabContent>

      <Button onclick={() => openModal = true}>Tambah Single Master BMHP</Button>
      <Modal
        bind:open={openModal}
        primaryButtonText="Submit"
        secondaryButtonText="Cancel"
        on:click:button--primary={async() => {

            let resp = await addBMHP(inputBMHP, inputBMHPTags);
            openModal = false;
            clearFields();
            notif.add({
              "kind": "success",
              "title": "Menambah Master BMHP",
              "subtitle": resp, 
              "timeout": 3000,
            });
          }
        }
        on:click:button--secondary={
          () => {
              (openModal = false);
            }
          }
      >
        <TextInput bind:value={inputBMHP} labelText="Nama BMHP" placeholder="Masukkan nama BMHP" />
        <TextInput bind:value={inputBMHPTags} labelText="Tags" placeholder="pisahkan dengan koma ," />
      </Modal>

    </TabContent>
    <TabContent>
       <!-- <TabelMasterBMHP /> -->
    </TabContent>
  </svelte:fragment>
</Tabs>

{:else}
Belum login
{/if}
