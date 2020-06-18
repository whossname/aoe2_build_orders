<script>
  import ParseText from "./ParseText.svelte";
  export let data;
</script>

<style>
  .build {
      font-style: italic;
  }
</style>

{#if !data}
  <span />
{:else if Array.isArray(data)}
  {#each data as sub}
    <ParseText data={sub} />
  {/each}
{:else}
  <span class={data.class}>{data.text}</span>
{/if}
