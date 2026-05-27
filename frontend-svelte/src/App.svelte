<script>
  import "carbon-components-svelte/css/all.css";

  let theme = "g90"; // "white" | "g10" | "g80" | "g90" | "g100"
  $: document.documentElement.setAttribute("theme", theme);

  import Router from "svelte-spa-router";
  import routes from "./routes";

  import {
    Content,
    Header,
    HeaderUtilities,
    HeaderGlobalAction,
    SideNav,
    SideNavDivider,
    SideNavItems,
    SideNavLink,
    SideNavMenu,
    SideNavMenuItem,
    SkipToContent,
  } from "carbon-components-svelte";
  import { Home, Contrast, Medication, Logout, Login } from "carbon-icons-svelte";

  let isSideNavOpen = false;
  import { getAuthState, login, logout } from "./pb/client.svelte";
  let auth = getAuthState();

</script>

<Header companyName="PharmaOS" platformName="PKM" href="#/" bind:isSideNavOpen>
  <svelte:fragment slot="skipToContent"><SkipToContent /></svelte:fragment>

  <HeaderUtilities>
  {#if auth.isLoggedIn}
      <HeaderGlobalAction
        iconDescription="Logout"
        tooltipAlignment="start"
        icon={Logout}
        on:click={() => {logout()}}
      />
  {:else}
      <HeaderGlobalAction
        iconDescription="Login"
        tooltipAlignment="start"
        icon={Login}
        on:click={() => {login("asdfasdf@gmail.com", "6asdas");}}
      />
  {/if}
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
    </SideNavMenu>
    <SideNavDivider />
    <SideNavLink text="Testing Page" href="#/testing"/>
  </SideNavItems>
</SideNav>

<Content>
  <Router {routes} />
</Content>
