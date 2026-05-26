<script>
  import "carbon-components-svelte/css/all.css";

  let theme = "g90"; // "white" | "g10" | "g80" | "g90" | "g100"
  $: document.documentElement.setAttribute("theme", theme);

  import {
    Column,
    Content,
    Grid,
    Header,
    HeaderUtilities,
    HeaderGlobalAction,
    Row,
    SideNav,
    SideNavDivider,
    SideNavItems,
    SideNavLink,
    SideNavMenu,
    SideNavMenuItem,
    SkipToContent,
  } from "carbon-components-svelte";
  import { Contrast } from "carbon-icons-svelte";

  let isSideNavOpen = false;
</script>

<Header companyName="PharmaOS" platformName="PKM" bind:isSideNavOpen>
  <svelte:fragment slot="skipToContent"><SkipToContent /></svelte:fragment>
  <HeaderUtilities>
    <HeaderGlobalAction
      iconDescription="Switch Theme"
      tooltipAlignment="end"
      icon={Contrast}
      on:click={() => {theme = theme === "g90" ? "g10" : "g90";}}
    />
  </HeaderUtilities>
</Header>

<SideNav bind:isOpen={isSideNavOpen}>
  <SideNavItems>
    <SideNavLink text="Link 1" />
    <SideNavLink text="Link 2" />
    <SideNavMenu text="Menu">
      <SideNavMenuItem href="/" text="Link 1" />
      <SideNavMenuItem href="/" text="Link 2" />
    </SideNavMenu>
    <SideNavDivider />
    <SideNavLink text="Link 4" />
  </SideNavItems>
</SideNav>

<Content>
  <Grid>
    <Row>
      <Column>
        <h3>Home</h3>
      </Column>
    </Row>
  </Grid>
</Content>
