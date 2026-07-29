<script>
  import "carbon-components-svelte/css/all.css";

  let theme = $state("g90"); // "white" | "g10" | "g80" | "g90" | "g100"
  $effect(() => { document.documentElement.setAttribute("theme", theme); });

  import Router from "svelte-spa-router";
  import routes from "./routes";

  import {
    Content,
    Header,
    HeaderUtilities,
    HeaderGlobalAction,
    HeaderAction,
    SideNav,
    SideNavDivider,
    SideNavItems,
    SideNavLink,
    SideNavMenu,
    SideNavMenuItem,
    SkipToContent,
    Modal,
    TextInput,
    PasswordInput,
    NotificationQueue,
  } from "carbon-components-svelte";
  import { Home, Contrast, Medication, Logout, Login, LockedAndBlocked } from "carbon-icons-svelte";

  let isSideNavOpen = $state(false);
  import { getAuthState, login, logout } from "./pb/client.svelte";
  import { notif } from "./lib/notif.svelte";
  let auth = $state(getAuthState());

  let email = localStorage.getItem("isianEmail") ?? "";
  let password = localStorage.getItem("isianPass") ?? "";

  let openModal = $state(false);


</script>

<Header companyName="PharmaOS" platformName="PKM" href="#/" bind:isSideNavOpen>
  <svelte:fragment slot="skipToContent"><SkipToContent /></svelte:fragment>

  <HeaderUtilities>
  {#if auth.isLoggedIn}
  
      <HeaderGlobalAction
        iconDescription={"Logout"}
        tooltipAlignment="end"
        icon={Logout}
        on:click={() => {
          logout();
          notif.add({
            kind: "warning",
            title: "Logout dari sistem",
            timeout: 3000,
          });
        }}
      />
  {:else}
      <HeaderGlobalAction
        iconDescription="Login"
        tooltipAlignment="start"
        icon={Login}
        on:click={() => {openModal = !openModal}}
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

<NotificationQueue bind:this={notif.ref} position="bottom-right" />

<SideNav bind:isOpen={isSideNavOpen}>
  <SideNavItems>
    {#if auth.isLoggedIn}
    <SideNavLink text="Home" href="#/" icon={Home} />
    <SideNavMenu text="Farmasi" expanded={true} icon={Medication}>
      <SideNavMenuItem href="#/masterbmhp" text="Master BMHP" />
    </SideNavMenu>
    <SideNavDivider />
    <SideNavLink text="Testing Page" href="#/testing"/>
    {:else}
    <SideNavLink text="Menu Terkunci" icon={LockedAndBlocked} />
    {/if}
  </SideNavItems>
</SideNav>

<Content>
  <Router {routes} />
</Content>

<Modal
  bind:open={openModal}
  primaryButtonText="Confirm"
  secondaryButtonText="Cancel"
  on:click:button--primary={() => {
    localStorage.setItem("isianEmail", email);
    localStorage.setItem("isianPass", password);
    login(email, password).then(val => notif.add({
      kind: "success",
      title: "Berhasil Login",
      timeout: 3000,
    })).catch(err => notif.add({
      kind: "error",
      title: "Gagal Login",
      subtitle: "Harus menggunakan akun superuser.",
      timeout: 3000,
      position: "bottom-right",
    }));
    openModal = false;
  }}
  on:click:button--secondary={() => (openModal = false)}
  on:open
  on:close
  on:submit
>
  <p>Login menggunakan superuser.</p>
  <TextInput bind:value={email} labelText="Email" placeholder="Masukkan email..." required />
  <PasswordInput bind:value={password} labelText="Password" placeholder="Masukkan password..." required/>
</Modal>
