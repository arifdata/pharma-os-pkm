<script>
  import { Button } from "carbon-components-svelte";

  /**
   * State kosong untuk tabel tanpa baris. Teks membedakan "belum ada data"
   * dan "tidak ada hasil pencarian" lewat props.
   *
   * @type {{
   *   title?: string,
   *   description?: string,
   *   actionLabel?: string,
   *   actionHref?: string,
   *   onAction?: (() => void) | undefined,
   * }}
   */
  let {
    title = "Belum ada data",
    description = "",
    actionLabel = "",
    actionHref = "",
    onAction = undefined,
  } = $props();
</script>

<div class="empty-state">
  <p class="empty-state__title">{title}</p>
  {#if description}
    <p class="empty-state__description">{description}</p>
  {/if}
  {#if actionLabel}
    {#if actionHref}
      <Button size="small" href={actionHref}>{actionLabel}</Button>
    {:else}
      <Button size="small" on:click={() => onAction?.()}>{actionLabel}</Button>
    {/if}
  {/if}
</div>

<style>
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 2rem 1rem;
    text-align: center;
    background: var(--cds-layer, #f4f4f4);
    border: 1px solid var(--cds-border-subtle, #e0e0e0);
    border-top: 0;
  }

  .empty-state__title {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.375rem;
    color: var(--cds-text-primary, #161616);
  }

  .empty-state__description {
    margin: 0 0 0.75rem;
    font-size: 0.875rem;
    line-height: 1.25rem;
    color: var(--cds-text-secondary, #525252);
  }

  .empty-state :global(.bx--btn) {
    margin-top: 0.5rem;
  }
</style>
