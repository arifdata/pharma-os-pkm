<script>
  import { Tabs, Tab, TabContent, Column, Button, Modal, TextInput, NotificationQueue } from "carbon-components-svelte";
  import { Table, Settings } from "carbon-icons-svelte";

  import TabelMasterBMHP from "./master_bmhp/TabelMasterBMHP.svelte";

  import { getAuthState, add } from "../../pb/client.svelte";
  let auth = getAuthState();
  let openModal = $state(false);
  let inputBMHP = $state("");
  let inputBMHPTags = $state("");
  let notif;
</script>

{#if auth.isLoggedIn}
<Tabs fullWidth selected={0}>
  <Tab label="Master BMHP" icon={Table}/>
  <Tab label="Tab 2" icon={Settings}/>
  <svelte:fragment slot="content">
    <TabContent>
        <!-- <TabelMasterBMHP /> -->

    </TabContent>
    <TabContent>
      <Button onclick={() => openModal = true}>Tambah Single Master BMHP</Button>
      <Modal
        bind:open={openModal}
        primaryButtonText="Submit"
        secondaryButtonText="Cancel"
        on:click:button--primary={() => {
          add(inputBMHP, inputBMHPTags);
          openModal = false;
          inputBMHP = "";
          inputBMHPTags = "";
        }
        }
        on:click:button--secondary={
          () => {
            (openModal = false);
            notif.add({
              "kind": "warning",
              "title": "Warning teks",
              "timeout": 3000,
            });
          }
          }
      >
        <TextInput bind:value={inputBMHP} labelText="Nama BMHP" placeholder="Masukkan nama BMHP" />
        <TextInput bind:value={inputBMHPTags} labelText="Tags" placeholder="pisahkan dengan koma ," />
      </Modal>
    </TabContent>
  </svelte:fragment>
</Tabs>

<NotificationQueue bind:this={notif} position="bottom-right" />

{:else}
Belum login
{/if}
