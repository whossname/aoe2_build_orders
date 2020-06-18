defmodule CodeSamples.Mixfile do
  use Mix.Project

  def application() do
    [applications: []]
  end

  def project() do
    [app: :code_samples, version: "1.0.0", deps: deps()]
  end

  defp deps() do
    [{:jason, "1.2.1"}]
  end
end
