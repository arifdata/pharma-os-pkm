<script>
  import { Button } from "carbon-components-svelte";
  import { ArrowLeft } from "carbon-icons-svelte";

  /**
   * Kerangka halaman: lebar maksimum, judul, tombol kembali, dan slot aksi.
   * Semua halaman domain memakai komponen ini supaya judul/aksi konsisten.
   *
   * @type {{
   *   title?: string,
   *   subtitle?: string,
   *   backHref?: string,
   *   backLabel?: string,
   *   actions?: import("svelte").Snippet,
   *   children?: import("svelte").Snippet,
   * }}
   */
  let {
    title = "",
    subtitle = "",
    backHref = "",
    backLabel = "Kembali",
    actions,
    children,
  } = $props();
</script>

<div class="page-shell">
  {#if backHref}
    <div class="page-shell__back">
      <Button
        kind="ghost"
        size="small"
        icon={ArrowLeft}
        iconDescription={backLabel}
        href={backHref}
      >
        {backLabel}
      </Button>
    </div>
  {/if}

  {#if title || actions}
    <header class="page-shell__header">
      <div class="page-shell__heading">
        <h1 class="page-shell__title">{title}</h1>
        {#if subtitle}
          <p class="page-shell__subtitle">{subtitle}</p>
        {/if}
      </div>
      {#if actions}
        <div class="page-shell__actions">{@render actions()}</div>
      {/if}
    </header>
  {/if}

  {@render children?.()}
</div>

<style>
  .page-shell {
    width: 100%;
    max-width: 90rem;
    margin-inline: auto;
    padding-bottom: 2rem;
  }

  .page-shell__back {
    margin-bottom: 0.5rem;
  }

  .page-shell__header {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 0.5rem 1rem;
    margin-bottom: 1rem;
  }

  .page-shell__title {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 400;
    line-height: 1.25;
    letter-spacing: 0;
    color: var(--cds-text-primary, #161616);
  }

  .page-shell__subtitle {
    margin: 0.25rem 0 0;
    font-size: 0.875rem;
    line-height: 1.25rem;
    color: var(--cds-text-secondary, #525252);
  }

  .page-shell__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }
</style>
