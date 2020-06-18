defmodule ParseJson do
  require Logger

  @new_order %{
    description: [],
    rows: [],
    header: [],
    note: []
  }

  def run() do
    {_, row, rows} =
      "../reference.json"
      |> File.read!()
      |> Jason.decode!()
      |> Enum.reduce({-1, [], []}, &group_rows/2)

    {_d, order, orders} =
      [row | rows]
      |> Enum.reduce({:table, @new_order, []}, &create_orders/2)

    orders = [order | orders]

    orders =
      orders
      |> Enum.map(&parse_order/1)

    index =
      orders
      |> Enum.map(& &1.title)
      |> Enum.reduce(%{}, &group_builds/2)
      |> Enum.map(fn {key, list} -> {key, Enum.reverse(list)} end)
      |> Enum.into(%{})
      |> Jason.encode!(pretty: true)

    "./output/index.json"
    |> File.write(index, [:write])
  end

  defp group_builds(title, acc) do
    group =
      cond do
        String.starts_with?(title, "22") -> :flush
        String.starts_with?(title, "23") -> :flush
        String.contains?(title, "Drush") -> :drush
        String.contains?(title, "FC") -> :fast_castle
        String.contains?(title, "FI") -> :fast_imperial
        String.contains?(title, "Galleys") -> :water
        String.contains?(title, "19") -> :flush
        true -> :other
      end

    Map.update(acc, group, [title], fn list -> [title | list] end)
  end

  defp parse_order(order) do
    [title | headers] =
      order.header
      |> List.flatten()
      |> Enum.reverse()

    title = title.span.text

    headers =
      headers
      |> Enum.map(&String.split(&1.span.text))
      |> List.flatten()

    [description] =
      order.description
      |> List.flatten()
      |> Enum.map(& &1.span)
      |> List.flatten()
      |> Enum.reduce([], &parse_description/2)

    rows =
      order.rows
      |> Enum.map(fn row ->
        Enum.reduce(row, %{}, &Map.update(&2, &1.col, [&1.span], fn list -> [&1.span | list] end))
      end)

    new_order = %{
      title: title,
      description: description.text,
      headers: headers,
      rows: rows
    }

    new_order =
      case List.flatten(order.note) do
        [] ->
          new_order

        [note] ->
          note = note.span.text
          Map.put(new_order, :note, note)
      end

    json =
      new_order
      |> Jason.encode!(pretty: true)

    # file_name = String.replace(title, " ", "_")

    "./output/#{title}.json"
    |> File.write(json, [:write])

    new_order
  end

  defp parse_description(next, []), do: [next]

  defp parse_description(next, [prev | list]) do
    if next.class == prev.class do
      text = prev.text <> " " <> next.text

      [%{class: next.class, text: text} | list]
    else
      [next, prev | list]
    end
  end

  defp create_orders(row, {phase, order, orders}) do
    case phase do
      :table ->
        if Enum.any?(row, &(&1.class == :table_header)) do
          order = Map.update!(order, :header, fn rows -> [row | rows] end)
          {:header, order, orders}
        else
          order = Map.update!(order, :rows, fn rows -> [row | rows] end)
          {:table, order, orders}
        end

      :header ->
        if Enum.any?(row, &(&1.class == :table_header)) do
          order = Map.update!(order, :rows, fn rows -> [row | rows] end)
          {:header, order, orders}
        else
          order = Map.update!(order, :description, fn rows -> [row | rows] end)
          {:description, order, orders}
        end

      :description ->
        cond do
          Enum.any?(row, &(&1.class == :note)) ->
            orders = [order | orders]
            order = Map.update!(@new_order, :note, fn rows -> [row | rows] end)

            {:table, order, orders}

          Enum.count(row) > 1 ->
            orders = [order | orders]
            order = Map.update!(@new_order, :rows, fn rows -> [row | rows] end)

            {:table, order, orders}

          is_not_description(row) ->
            orders = [order | orders]
            order = Map.update!(@new_order, :rows, fn rows -> [row | rows] end)

            {:table, order, orders}

          true ->
            order = Map.update!(order, :description, fn rows -> [row | rows] end)
            {:description, order, orders}
        end
    end
  end

  defp is_not_description([%{span: span}]) do
    case span do
      %{text: text} ->
        String.starts_with?(text, "+") or
          String.starts_with?(text, "Build [")

      spans ->
        Enum.any?(spans, &String.starts_with?(&1.text, "+")) or
          Enum.any?(spans, &(&1.class != :normal))
    end
  end

  defp group_rows(
         %{
           "@class" => class,
           "@style" => style,
           "span" => span
         },
         {prev_col, row, all}
       ) do
    {indent, ""} =
      style
      |> String.trim_leading("position: relative; left: ")
      |> String.trim_trailing("px;")
      |> Float.parse()

    col =
      cond do
        indent < 111.29 -> 0
        indent < 316.21 -> 1
        indent < 368.555 -> 2
        indent < 414.3 -> 3
        indent < 462.685 -> 4
        indent < 510 -> 5
        true -> 6
      end

    span = parse_span(span)
    class = parse_class(class)
    el = %{class: class, span: span, col: col}

    cond do
      prev_col < col ->
        {col, [el | row], all}

      true ->
        {col, [el], [row | all]}
    end
  end

  defp parse_span([]), do: []

  defp parse_span([span | spans]) do
    span = parse_span(span)
    spans = parse_span(spans)
    [span | spans]
  end

  defp parse_span(%{"#text" => text, "@class" => class}) do
    class = parse_class(class)
    text = String.replace(text, "\r\n      ", " ")
    %{text: text, class: class}
  end

  defp parse_class(class) do
    case class do
      "cls_002" -> :normal
      "cls_004" -> :build
      "cls_005" -> :age_section
      "cls_006" -> :table_header
      "cls_008" -> :advancing_section
      "cls_009" -> :arrow
      "cls_010" -> :arrow_right
      "cls_019" -> :note
      "cls_020" -> :superscript
    end
  end
end

ParseJson.run()
