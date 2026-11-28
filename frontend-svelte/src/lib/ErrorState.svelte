<script>
  import { Button, InlineNotification } from "carbon-components-svelte";

  /**
   * State gagal muat data. Dipakai seragam di semua halaman list/detail.
   *
   * @type {{ message?: string, description?: string, onRetry?: (() => void) | undefined }}
   */
  let {
    message = "Gagal memuat data",
    description = "",
    onRetry = undefined,
  } = $props();
</script>

<div class="error-state">
  <InlineNotification
    kind="error"
    lowContrast
    title={message}
    subtitle={description}
    hideCloseButton
  />
  {#if onRetry}
    <div class="error-state__actions">
      <Button kind="tertiary" size="small" on:click={onRetry}>Coba lagi</Button>
    </div>
  {/if}
</div>

<style>
  .error-state {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .error-state__actions {
    display: flex;
    justify-content: flex-end;
  }
</style>
