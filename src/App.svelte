<script>
  import Menu from "./Menu.svelte";
  import BuildOrder from "./BuildOrder.svelte";

  let buildOrder = null;

  const setBuildOrder = order => {
    fetch(`json/build_orders/${order}.json`)
      .then(res => res.json())
      .then(data => {
        buildOrder = data;
      })
      .catch(err => console.error(err));
  };

  const clearBuildOrder = () => {
    buildOrder = null;
  };
</script>

<style>
  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>

<main>
  {#if buildOrder}
    <BuildOrder {buildOrder} {clearBuildOrder} />
  {:else}
    <Menu {setBuildOrder} />
  {/if}
</main>
