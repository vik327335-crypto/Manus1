import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ComparisonChart } from "./ComparisonChart";

describe("ComparisonChart Component", () => {
  const mockAssets = [
    {
      ticker: "BTC",
      name: "Bitcoin",
      score: 85,
      cScore: 90,
      aScore: 85,
      nScore: 80,
      sScore: 75,
      lScore: 90,
      iScore: 85,
      mScore: 80,
    },
    {
      ticker: "ETH",
      name: "Ethereum",
      score: 78,
      cScore: 80,
      aScore: 75,
      nScore: 70,
      sScore: 80,
      lScore: 85,
      iScore: 80,
      mScore: 75,
    },
  ];

  it("должен отображать заголовок", () => {
    render(<ComparisonChart assets={mockAssets} />);
    expect(screen.getByText(/Сравнение активов по CAN SLIM критериям/i)).toBeInTheDocument();
  });

  it("должен отображать легенду критериев", () => {
    render(<ComparisonChart assets={mockAssets} />);

    expect(screen.getByText(/C - Current/i)).toBeInTheDocument();
    expect(screen.getByText(/A - Annual/i)).toBeInTheDocument();
    expect(screen.getByText(/N - New/i)).toBeInTheDocument();
    expect(screen.getByText(/S - Supply/i)).toBeInTheDocument();
    expect(screen.getByText(/L - Leader/i)).toBeInTheDocument();
    expect(screen.getByText(/I - Institutional/i)).toBeInTheDocument();
    expect(screen.getByText(/M - Market/i)).toBeInTheDocument();
  });

  it("должен отображать активы для сравнения", () => {
    render(<ComparisonChart assets={mockAssets} />);

    expect(screen.getByText("BTC")).toBeInTheDocument();
    expect(screen.getByText("Bitcoin")).toBeInTheDocument();
    expect(screen.getByText("ETH")).toBeInTheDocument();
    expect(screen.getByText("Ethereum")).toBeInTheDocument();
  });

  it("должен отображать score для каждого актива", () => {
    render(<ComparisonChart assets={mockAssets} />);

    const scores = screen.getAllByText(/^(85|78)$/);
    expect(scores.length).toBeGreaterThan(0);
  });

  it("должен отображать пустое сообщение когда нет активов", () => {
    render(<ComparisonChart assets={[]} />);
    expect(screen.getByText(/Нет активов для сравнения/i)).toBeInTheDocument();
  });

  it("должен отображать значения критериев", () => {
    render(<ComparisonChart assets={mockAssets} />);

    // BTC scores: 90, 85, 80, 75, 90, 85, 80
    expect(screen.getByText("90")).toBeInTheDocument();
    expect(screen.getByText("85")).toBeInTheDocument();
    expect(screen.getByText("80")).toBeInTheDocument();
  });

  it("должен отображать информацию о шкале", () => {
    render(<ComparisonChart assets={mockAssets} />);
    expect(
      screen.getByText(/Шкала: 0-100 баллов/i)
    ).toBeInTheDocument();
  });

  it("должен обрабатывать несколько активов", () => {
    const manyAssets = Array.from({ length: 5 }, (_, i) => ({
      ticker: `COIN${i}`,
      name: `Coin ${i}`,
      score: 50 + i * 10,
      cScore: 60 + i * 5,
      aScore: 55 + i * 5,
      nScore: 50 + i * 5,
      sScore: 45 + i * 5,
      lScore: 65 + i * 5,
      iScore: 60 + i * 5,
      mScore: 55 + i * 5,
    }));

    render(<ComparisonChart assets={manyAssets} />);

    expect(screen.getByText("COIN0")).toBeInTheDocument();
    expect(screen.getByText("COIN4")).toBeInTheDocument();
  });
});
