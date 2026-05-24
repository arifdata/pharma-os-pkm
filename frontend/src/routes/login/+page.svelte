<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import { IconMail, IconLock, IconEye, IconEyeOff } from "@tabler/icons-svelte";

  let email = $state("");
  let password = $state("");
  let showPassword = $state(false);

  function handleSubmit(e: Event) {
    e.preventDefault();
    console.log("Login attempt", { email, password });
  }
</script>

<div class="min-h-screen flex items-center justify-center px-4">
  <div class="w-full max-w-sm space-y-6">
    <div class="text-center space-y-2">
      <h1 class="text-2xl font-semibold tracking-tight">Masuk</h1>
      <p class="text-sm text-muted-foreground">
        Masukkan email dan password untuk melanjutkan
      </p>
    </div>

    <form onsubmit={handleSubmit} class="space-y-4">
      <div class="space-y-2">
        <label for="email" class="text-sm font-medium leading-none">Email</label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
            <IconMail size={16} />
          </div>
          <input
            id="email"
            type="email"
            placeholder="nama@email.com"
            bind:value={email}
            required
            class="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
      </div>

      <div class="space-y-2">
        <label for="password" class="text-sm font-medium leading-none">Password</label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
            <IconLock size={16} />
          </div>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            bind:value={password}
            required
            class="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-10 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          <button
            type="button"
            onclick={() => showPassword = !showPassword}
            class="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            {#if showPassword}
              <IconEyeOff size={16} />
            {:else}
              <IconEye size={16} />
            {/if}
          </button>
        </div>
      </div>

      <Button type="submit" class="w-full">Masuk</Button>
    </form>

  </div>
</div>
