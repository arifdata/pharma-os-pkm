<script>
  import "carbon-components-svelte/css/all.css";

  let theme = "g90"; // "white" | "g10" | "g80" | "g90" | "g100"
  $: document.documentElement.setAttribute("theme", theme);

  import Router from "svelte-spa-router";
  import routes from "./routes";

  import {
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
  import { Home, Contrast, Medication, Table } from "carbon-icons-svelte";

  let isSideNavOpen = false;
</script>

<Header companyName="PharmaOS" platformName="PKM" href="#/" bind:isSideNavOpen>
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
    <SideNavLink text="Home" href="#/" icon={Home} />
    <SideNavMenu text="Farmasi" expanded={true} icon={Medication}>
      <SideNavMenuItem href="#/masterbmhp" text="Master BMHP" />
      <SideNavMenuItem href="/" text="Link 2" />
    </SideNavMenu>
    <SideNavLink text="Other" href="#/other"/>
    <SideNavDivider />
    <SideNavLink text="Link 4" />
  </SideNavItems>
</SideNav>

<Content>
  <Grid>
    <Row>
      <Router {routes} />
    </Row>
  </Grid>
</Content>
