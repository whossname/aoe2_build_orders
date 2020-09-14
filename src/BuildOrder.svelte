<script>
  export let buildOrder;
  export let clearBuildOrder;

  import ParseText from "./ParseText.svelte";

  let displayDescription = false;
  function toggleDescription() {
    displayDescription = !displayDescription;
  }

  const headers = buildOrder.headers;

  const ageRow = row => {
    const count = Object.keys(row).length;
    if (count === 1) {
      const cls = row[0][0].class;
      if (cls === "advancing_section" || cls === "age_section")
        return "age-row";
    }
    return "";
  };

  const checkForBuildCell = row => {
    const count = Object.keys(row).length;
    if (count === 1) {
      return "build-cell";
    }
    return "";
  };
</script>

<style>
  .title-btn {
    background-color: #777;
    color: white;
    cursor: pointer;
    padding: 18px;
    margin-bottom: 0;
    width: 85%;
    border: none;
    text-align: left;
    outline: none;
    font-size: 40px;
  }

  .title-btn:hover {
    background-color: #666;
  }

  .description-toggle {
    background-color: #555;
    color: white;
    cursor: pointer;
    padding-left: 1em;
    padding-right: 1em;
    margin-top: 0.5em;
    margin-bottom: 0em;
    margin-right: 0.8em;
    text-align: right;
    outline: none;
    font-size: 30px;
    display: block;
  }

  .description-toggle:hover {
    background-color: #444;
  }
  .description-hidden {
    display: none;
  }

  .description-shown {
    background-color: #444;
    font-size: 25px;
    align-content: center;
    width: 80%;
    margin: 1em auto;
    padding: 1em;
  }

  .header {
    display: flex;
    justify-content: space-between;
  }

  .build-col {
    background-color: #111;
    text-align: left;
    padding-left: 1em;
  }

  table {
    font-size: 25px;
    margin: 1em auto;
    width: 100%;
  }

  .SheepBoar-col {
    background-color: #200000;
    padding: 0;
  }
  .Berries-col {
    background-color: #300000;
  }

  .Farms-col {
    background-color: #001000;
  }
  .Wood-col {
    background-color: #301000;
  }
  .Gold-col {
    background-color: #333305;
  }
  .Stone-col {
    background-color: #333;
  }
  .Fish-col {
    background-color: DarkSlateBlue;
  }

  .Fish-col {
    background-color: DarkSlateBlue;
  }

  td {
    padding: 0.5em;
    text-align: center;
    font-weight: bold;
  }

  th {
    padding: 1.5em;
    font-weight: bolder;
    color: white !important;
    background-color: black !important;
  }

  .age-row {
    background-color: rgb(30, 30, 30);
  }

  .build-cell {
    text-align: right;
    padding-right: 1em;
  }
</style>

<div class="header">
  <button type="button" class="title-btn" on:click={clearBuildOrder}>
    &lArr; {buildOrder.title}
  </button>

  <button type="button" class="description-toggle" on:click={toggleDescription}>
    Description
  </button>
</div>

<div class={displayDescription ? 'description-shown' : 'description-hidden'}>
  {buildOrder.description}
</div>

<table>
  <th style=" background-color: rgb(39, 39, 39) !important;" />
  {#each headers as header}
    <th class="{header.replace('/', '')}-col">{header}</th>
  {/each}

  {#each buildOrder.rows as row}
    <tr>
      {#if ageRow(row)}
        <td colspan="7" class="age-row">
          <ParseText data={row[0]} />
        </td>
      {:else}
        <td class="build-col {checkForBuildCell(row)}">
          <ParseText data={row[0]} />
        </td>
        <td class="{headers[0].replace('/', '')}-col ">
          <ParseText data={row[1]} />
        </td>
        <td class="{headers[1]}-col ">
          <ParseText data={row[2]} />
        </td>
        <td class="{headers[2]}-col ">
          <ParseText data={row[3]} />
        </td>
        <td class="{headers[3]}-col ">
          <ParseText data={row[4]} />
        </td>
        <td class="{headers[4]}-col ">
          <ParseText data={row[5]} />
        </td>
        <td class="{headers[5]}-col ">
          <ParseText data={row[6]} />
        </td>
      {/if}
    </tr>
  {/each}
</table>
