<script>
  import Menu from "./Menu.svelte";
  import BuildOrder from "./BuildOrder.svelte";

  let params = new URLSearchParams(document.location.search);
  let orderName = params.get("orderName");
  let buildOrder = null;

  const setBuildOrder = order => {
    fetch(`json/build_orders/${order}.json`)
      .then(res => res.json())
      .then(data => {
        params.set("orderName", order);
        history.pushState(null, null, "?" + params.toString());
        buildOrder = data;
      })
      .catch(err => console.error(err));
  };

  const clearBuildOrder = () => {
    history.pushState(null, null, "?");
    buildOrder = null;
  };

  if (orderName) {
    buildOrder = setBuildOrder(orderName);
  }
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
