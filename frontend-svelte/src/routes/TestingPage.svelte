
<script>
  import { Column } from "carbon-components-svelte";
  import { Player } from "../zod-schemas/coba";

  let coba = Player.safeParse({
    name: "Dorman",
    xp: 100,
  });

  console.log(coba);
</script>

<Column>
  Other Page
</Column>
