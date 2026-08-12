<script>
  import { onMount } from "svelte";
  import {
    Box,
    Button,
    ButtonSet,
    TextInput,
    DatePicker,
    DatePickerInput,
    SearchMenu,
    SearchMenuItem,
    NumberInput,
    Column,
    Grid,
    Row,
    Text
  } from "carbon-components-svelte";
  import { Indonesian } from "flatpickr/dist/l10n/id";
  import { Add, Subtract, RenewAlt } from "carbon-icons-svelte";
  import { pb } from "../../../pb/client.svelte";
  import { notif } from "../../../lib/notif.svelte";
  import { TambahBukuPenerimaanSchema } from "../../../validation-schema";

  /** @type {{id_bmhp:string}[]} */
  let items = $state([]);
  $inspect(items);
  let nomorSurat = $state("");
  let sumberBarang = $state("");
  let tanggalTerima = $state("");
  /** @type {{id:string, name:string}[]} */
  let masterBMHP = $state([]);

  async function fetchMasterBMHP() {
    try {
      const records = await pb.collection("master_bmhp").getFullList({
        sort: "nama_bmhp",
      });
      masterBMHP = records.map((r) => ({
        id: r.id,
        name: r.nama_bmhp,
      }));
    } catch (e) {
      console.error("Gagal fetch master_bmhp:", e);
    }
  }

  onMount(() => {
    fetchMasterBMHP();
  });

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

{#snippet renderDaftarItems()}
  {#if items.length > 0}
    <Box fill="layer-01" padding={4} marginY={4}>
      <Text>Daftar Items:</Text>
      {#each items as item, idx (idx)}
        <Box fill="layer-02" padding={4} marginY={4}>
          <Grid>
            <Row style="align-items: flex-start; margin-bottom: 1rem;">
              {@const selectedName = masterBMHP.find(m => m.id === item.id_bmhp)?.name ?? ''}
              <div class="label-text">{idx+1}</div>
              <SearchMenu
                placeholder="Search Nama BMHP..."
                size="sm"
                value={selectedName}
                on:select={(e) => {
                  item.id_bmhp = e.detail.value;
                }}
                on:clear={() => {
                  item.id_bmhp = '';
                }}
              >
                {#each masterBMHP as bmhp (bmhp.id)}
                  <SearchMenuItem
                    text={bmhp.name}
                    value={bmhp.id}
                  />
                {/each}
              </SearchMenu>
            </Row>
            <Row noGutterLeft>
              <Column>
                <NumberInput
                  labelText="Jumlah"
                  size="sm"
                  fluid
                  bind:value={item.jumlah}
                  min={1}
                  invalidText="Tidak bisa di bawah 1"
                />
              </Column>
              <Column>
                <TextInput
                  labelText="Nomor Batch"
                  size="sm"
                  fluid
                  bind:value={item.no_batch}
                />
              </Column>
              <Column>
                <DatePicker fluid datePickerType="single" locale={Indonesian} dateFormat="Y-m-d" on:change bind:value={item.tgl_expired}>
                  <DatePickerInput labelText="Tanggal Expired" placeholder="yyyy-mm-dd" />
                </DatePicker>
              </Column>
              <Column>
                <NumberInput
                  labelText="Harga Satuan (Rp.)"
                  size="sm"
                  fluid
                  bind:value={item.harga_satuan}
                  min={0}
                  step={0.5}
                  invalidText="Tidak bisa di bawah 0"
                />
              </Column>
              <Column>
                <TextInput
                  labelText="Labels"
                  placeholder="pisahkan dengan koma ,"
                  size="sm"
                  fluid
                  bind:value={item.labels}
                />
              </Column>
            </Row>
          </Grid>
        </Box>
      {/each}
    </Box>
  {/if}
{/snippet}

<Box fill="field" padding={4} marginY={4}>
  <TextInput labelText="Nomor Surat" placeholder="Input nomor surat..." bind:value={nomorSurat}/>
  <br>
  <Button kind="tertiary" icon={RenewAlt} size="small" on:click={() => {
    const srt = generateNomorSurat();
    nomorSurat = srt;
  }}>Generate No.Surat</Button>
</Box>

<Box fill="field" padding={4} marginY={4}>
  <TextInput labelText="Sumber Barang" placeholder="Input sumber barang..." bind:value={sumberBarang}/>
</Box>


<Box fill="field" padding={4} marginY={4}>
  <DatePicker datePickerType="single" locale={Indonesian} dateFormat="Y-m-d" on:change bind:value={tanggalTerima}>
    <DatePickerInput labelText="Tanggal Terima" placeholder="yyyy-mm-dd" />
  </DatePicker>
</Box>

{@render renderDaftarItems()}

<Box fill="field" padding={4} marginY={4}>
  <ButtonSet>
    <Button icon={Add} on:click={() => {
      items.push({ "id_bmhp": "", "jumlah": 1, "no_batch": "", "tgl_expired": "", "harga_satuan": 0, "labels": "" });
    }} />
    <Button kind="secondary" icon={Subtract} on:click={() => {
      items.pop();
    }} />
    {#if (items.length > 0)}
      <Button kind="primary" on:click={() => {
        const formData = {
          no_surat: nomorSurat,
          sumber: sumberBarang,
          tgl_terima: tanggalTerima,
          daftar_item: items,

        };
        const submit = TambahBukuPenerimaanSchema.safeParse(formData);
        if (!submit.success) {
          for (const err of submit.error.issues) {
            notif.add({
              kind: "error",
              title: err.message,
              timeout: 3000,
            });
          }
        } else {
          console.log("proses input data")
        }
      }}>Submit</Button>
    {:else}
      <Button kind="primary" disabled>Submit</Button>
    {/if}
  </ButtonSet>
</Box>

<style>
  .label-text {
    margin-top: 0.55rem;
    font-size: 0.75rem;
    font-weight: 400;
    color: var(--cds-text-secondary, #525252);
    margin-bottom: 0.5rem;
    line-height: 1rem;
  }
</style>

