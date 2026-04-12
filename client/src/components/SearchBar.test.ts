import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchBar } from "./SearchBar";

describe("SearchBar Component", () => {
  const mockItems = [
    { id: 1, ticker: "BTC", name: "Bitcoin", category: "Layer1", score: 85 },
    { id: 2, ticker: "ETH", name: "Ethereum", category: "Layer1", score: 78 },
    { id: 3, ticker: "SOL", name: "Solana", category: "Layer1", score: 72 },
    { id: 4, ticker: "ADA", name: "Cardano", category: "Layer1", score: 65 },
  ];

  it("должен отображать input с placeholder", () => {
    const mockOnSearch = vi.fn();
    render(
      <SearchBar
        items={mockItems}
        onSearch={mockOnSearch}
        placeholder="Поиск..."
      />
    );

    const input = screen.getByPlaceholderText("Поиск...");
    expect(input).toBeInTheDocument();
  });

  it("должен фильтровать по тикеру", async () => {
    const mockOnSearch = vi.fn();
    const { container } = render(
      <SearchBar items={mockItems} onSearch={mockOnSearch} />
    );

    const input = container.querySelector("input");
    if (input) {
      await userEvent.type(input, "BTC");
      expect(mockOnSearch).toHaveBeenCalledWith([mockItems[0]]);
    }
  });

  it("должен фильтровать по названию", async () => {
    const mockOnSearch = vi.fn();
    const { container } = render(
      <SearchBar items={mockItems} onSearch={mockOnSearch} />
    );

    const input = container.querySelector("input");
    if (input) {
      await userEvent.type(input, "Bitcoin");
      expect(mockOnSearch).toHaveBeenCalledWith([mockItems[0]]);
    }
  });

  it("должен фильтровать по категории", async () => {
    const mockOnSearch = vi.fn();
    const { container } = render(
      <SearchBar items={mockItems} onSearch={mockOnSearch} />
    );

    const input = container.querySelector("input");
    if (input) {
      await userEvent.type(input, "Layer1");
      expect(mockOnSearch).toHaveBeenCalledWith(mockItems);
    }
  });

  it("должен быть case-insensitive", async () => {
    const mockOnSearch = vi.fn();
    const { container } = render(
      <SearchBar items={mockItems} onSearch={mockOnSearch} />
    );

    const input = container.querySelector("input");
    if (input) {
      await userEvent.type(input, "btc");
      expect(mockOnSearch).toHaveBeenCalledWith([mockItems[0]]);
    }
  });

  it("должен очищать поиск при клике на X", async () => {
    const mockOnSearch = vi.fn();
    const { container } = render(
      <SearchBar items={mockItems} onSearch={mockOnSearch} />
    );

    const input = container.querySelector("input") as HTMLInputElement;
    if (input) {
      await userEvent.type(input, "BTC");
      expect(input.value).toBe("BTC");

      const clearButton = container.querySelector("button");
      if (clearButton) {
        fireEvent.click(clearButton);
        expect(input.value).toBe("");
        expect(mockOnSearch).toHaveBeenCalledWith(mockItems);
      }
    }
  });

  it("должен возвращать все элементы при пустом поиске", async () => {
    const mockOnSearch = vi.fn();
    const { container } = render(
      <SearchBar items={mockItems} onSearch={mockOnSearch} />
    );

    const input = container.querySelector("input");
    if (input) {
      await userEvent.type(input, "");
      expect(mockOnSearch).toHaveBeenCalledWith(mockItems);
    }
  });
});
