import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VirtualizedAssetList } from "./VirtualizedAssetList";

describe("VirtualizedAssetList Component", () => {
  const mockItems = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    ticker: `COIN${i}`,
    name: `Coin ${i}`,
    currentPrice: 100 + i,
    priceChange24h: Math.random() * 20 - 10,
    marketCap: 1000000 * (i + 1),
    volume24h: 500000 * (i + 1),
    score: 50 + Math.random() * 50,
    category: "Layer1",
  }));

  it("должен отображать заголовок таблицы", () => {
    render(
      <VirtualizedAssetList items={mockItems} />
    );

    expect(screen.getByText(/Актив/i)).toBeInTheDocument();
    expect(screen.getByText(/Цена/i)).toBeInTheDocument();
    expect(screen.getByText(/Score/i)).toBeInTheDocument();
  });

  it("должен отображать первую страницу активов", () => {
    render(
      <VirtualizedAssetList items={mockItems} itemsPerPage={10} />
    );

    // Проверяем что первые 10 элементов отображены
    expect(screen.getByText("COIN0")).toBeInTheDocument();
    expect(screen.getByText("COIN9")).toBeInTheDocument();
    expect(screen.queryByText("COIN10")).not.toBeInTheDocument();
  });

  it("должен отображать loading state", () => {
    render(
      <VirtualizedAssetList items={[]} isLoading={true} />
    );

    expect(screen.getByText(/Загрузка активов/i)).toBeInTheDocument();
  });

  it("должен отображать пустое состояние", () => {
    render(
      <VirtualizedAssetList items={[]} />
    );

    expect(screen.getByText(/Активы не найдены/i)).toBeInTheDocument();
  });

  it("должен вызывать onItemClick при клике на элемент", () => {
    const mockOnClick = vi.fn();
    render(
      <VirtualizedAssetList items={mockItems} onItemClick={mockOnClick} itemsPerPage={10} />
    );

    const firstItem = screen.getByText("COIN0");
    fireEvent.click(firstItem.closest("div[class*='px-4']"));

    expect(mockOnClick).toHaveBeenCalledWith(expect.objectContaining({ ticker: "COIN0" }));
  });

  it("должен переходить на следующую страницу", () => {
    render(
      <VirtualizedAssetList items={mockItems} itemsPerPage={10} />
    );

    // Проверяем первую страницу
    expect(screen.getByText("COIN0")).toBeInTheDocument();

    // Нажимаем кнопку "Далее"
    const nextButton = screen.getAllByRole("button")[1];
    fireEvent.click(nextButton);

    // Проверяем вторую страницу
    expect(screen.getByText("COIN10")).toBeInTheDocument();
    expect(screen.queryByText("COIN0")).not.toBeInTheDocument();
  });

  it("должен переходить на предыдущую страницу", () => {
    render(
      <VirtualizedAssetList items={mockItems} itemsPerPage={10} />
    );

    // Нажимаем "Далее"
    const nextButton = screen.getAllByRole("button")[1];
    fireEvent.click(nextButton);

    // Нажимаем "Назад"
    const prevButton = screen.getAllByRole("button")[0];
    fireEvent.click(prevButton);

    // Проверяем что вернулись на первую страницу
    expect(screen.getByText("COIN0")).toBeInTheDocument();
  });

  it("должен отключать кнопку Назад на первой странице", () => {
    render(
      <VirtualizedAssetList items={mockItems} itemsPerPage={10} />
    );

    const prevButton = screen.getAllByRole("button")[0];
    expect(prevButton).toBeDisabled();
  });

  it("должен отключать кнопку Далее на последней странице", () => {
    render(
      <VirtualizedAssetList items={mockItems} itemsPerPage={10} />
    );

    // Переходим на последнюю страницу
    const nextButton = screen.getAllByRole("button")[1];
    for (let i = 0; i < 4; i++) {
      fireEvent.click(nextButton);
    }

    // Проверяем что кнопка Далее отключена
    expect(nextButton).toBeDisabled();
  });

  it("должен отображать правильный счётчик страниц", () => {
    render(
      <VirtualizedAssetList items={mockItems} itemsPerPage={10} />
    );

    expect(screen.getByText(/1 \/ 5/)).toBeInTheDocument();
  });

  it("должен отображать информацию о количестве активов", () => {
    render(
      <VirtualizedAssetList items={mockItems} itemsPerPage={10} />
    );

    expect(screen.getByText(/Показано 1-10 из 50 активов/)).toBeInTheDocument();
  });

  it("должен отображать цветовое кодирование для изменения цены", () => {
    const itemsWithPrice = [
      {
        ...mockItems[0],
        priceChange24h: 5, // Положительное
      },
      {
        ...mockItems[1],
        priceChange24h: -3, // Отрицательное
      },
    ];

    render(
      <VirtualizedAssetList items={itemsWithPrice} />
    );

    const positiveChange = screen.getByText("+5.00%");
    const negativeChange = screen.getByText("-3.00%");

    expect(positiveChange).toHaveClass("text-green-600");
    expect(negativeChange).toHaveClass("text-red-600");
  });
});
