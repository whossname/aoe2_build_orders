<script>
  import * as index from "../public/json/build_orders/index.json";
  export let setBuildOrder;

  const entries = Object.entries(index);
  const expanded = {};
  entries.pop();

  function toggleCollapsible(type) {
    expanded[type] = !expanded[type];
  }
</script>

<style>
  .collapsible-btn {
    background-color: #777;
    color: white;
    cursor: pointer;
    padding: 18px;
    padding-left: 80px;
    margin-bottom: 0;
    margin-left: auto;
    margin-right: auto;
    width: 100%;
    border: none;
    text-align: left;
    outline: none;
    font-size: 40px;
  }

  .collapsible-btn:hover {
    background-color: #666;
  }

  .collapsible {
    margin-top: 0.5em;
    margin-bottom: 1em;
  }

  .collapsible-hidden {
    display: none;
  }

  .collapsible-shown {
    align-content: center;
  }

  .build-order {
    background-color: #555;
    color: white;
    cursor: pointer;
    padding: 14px;
    padding-left: 2em;
    margin: 0.3em auto;
    width: 95%;
    border: none;
    text-align: left;
    outline: none;
    font-size: 35px;
    display: block;
  }

  .build-order:hover {
    background-color: #444;
  }
</style>

{#each entries as orders}
  <div class="collapsible">
    <button
      type="button"
      class="collapsible-btn"
      on:click={() => toggleCollapsible(orders[0])}>
      {orders[0].toUpperCase().replace('_', ' ')}
    </button>
    <div
      class={expanded[orders[0]] ? 'collapsible-shown' : 'collapsible-hidden'}>
      {#each orders[1] as order}
        <button
          type="button"
          class="build-order"
          on:click={() => setBuildOrder(order)}>
          {order}
        </button>
      {/each}
    </div>
  </div>
{/each}
