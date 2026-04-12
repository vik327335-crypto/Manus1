import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Analytics from "@/pages/Analytics";

describe("Analytics Component", () => {
  it("должен отображать заголовок Аналитика", () => {
    render(<Analytics />);
    expect(screen.getByText("Аналитика")).toBeInTheDocument();
  });

  it("должен отображать основные метрики", () => {
    render(<Analytics />);

    expect(screen.getByText(/Средний CAN SLIM Score/i)).toBeInTheDocument();
    expect(screen.getByText(/Среднее изменение 24h/i)).toBeInTheDocument();
    expect(screen.getByText(/Общая рыночная кап/i)).toBeInTheDocument();
    expect(screen.getByText(/Всего активов/i)).toBeInTheDocument();
  });

  it("должен отображать распределение по Score", () => {
    render(<Analytics />);

    expect(screen.getByText(/Отличные \(80\+\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Хорошие \(70-79\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Средние \(60-69\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Слабые \(<60\)/i)).toBeInTheDocument();
  });

  it("должен отображать тренды цен", () => {
    render(<Analytics />);

    expect(screen.getByText(/Растущие активы/i)).toBeInTheDocument();
    expect(screen.getByText(/Падающие активы/i)).toBeInTheDocument();
    expect(screen.getByText(/Стабильные активы/i)).toBeInTheDocument();
  });

  it("должен отображать топ активы", () => {
    render(<Analytics />);

    expect(screen.getByText(/Топ активы по CAN SLIM Score/i)).toBeInTheDocument();
    expect(screen.getByText("BTC")).toBeInTheDocument();
    expect(screen.getByText("ETH")).toBeInTheDocument();
  });

  it("должен вычислять средний score корректно", () => {
    render(<Analytics />);

    // BTC: 85, ETH: 78, SOL: 72, ADA: 65, XRP: 58
    // Среднее: (85 + 78 + 72 + 65 + 58) / 5 = 71.6
    const avgScore = screen.getByText("71.6");
    expect(avgScore).toBeInTheDocument();
  });

  it("должен отображать цветовое кодирование для изменения цены", () => {
    render(<Analytics />);

    // Среднее изменение: (2.5 + 1.8 - 0.5 + 0.2 - 1.2) / 5 = 0.56
    const avgChange = screen.getByText("+0.56%");
    expect(avgChange).toHaveClass("text-green-600");
  });

  it("должен отображать правильное количество активов", () => {
    render(<Analytics />);

    const totalAssets = screen.getByText("5");
    expect(totalAssets).toBeInTheDocument();
  });
});
