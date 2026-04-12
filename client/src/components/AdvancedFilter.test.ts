import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdvancedFilter } from "./AdvancedFilter";

describe("AdvancedFilter Component", () => {
  it("должен отображать кнопку Фильтры", () => {
    const mockOnFilterChange = vi.fn();
    render(<AdvancedFilter onFilterChange={mockOnFilterChange} />);

    const button = screen.getByRole("button", { name: /фильтры/i });
    expect(button).toBeInTheDocument();
  });

  it("должен открывать панель фильтров при клике", async () => {
    const mockOnFilterChange = vi.fn();
    render(<AdvancedFilter onFilterChange={mockOnFilterChange} />);

    const button = screen.getByRole("button", { name: /фильтры/i });
    fireEvent.click(button);

    const heading = screen.getByText("Расширенные фильтры");
    expect(heading).toBeInTheDocument();
  });

  it("должен обновлять фильтр CAN SLIM Score", async () => {
    const mockOnFilterChange = vi.fn();
    const { container } = render(
      <AdvancedFilter onFilterChange={mockOnFilterChange} />
    );

    const button = screen.getByRole("button", { name: /фильтры/i });
    fireEvent.click(button);

    const inputs = container.querySelectorAll("input[type='number']");
    if (inputs.length > 0) {
      await userEvent.type(inputs[0], "50");
      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({ minScore: 50 })
      );
    }
  });

  it("должен обновлять фильтр рыночной капитализации", async () => {
    const mockOnFilterChange = vi.fn();
    const { container } = render(
      <AdvancedFilter onFilterChange={mockOnFilterChange} />
    );

    const button = screen.getByRole("button", { name: /фильтры/i });
    fireEvent.click(button);

    const inputs = container.querySelectorAll("input[type='number']");
    if (inputs.length > 2) {
      await userEvent.type(inputs[2], "1000000");
      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({ minMarketCap: 1000000 })
      );
    }
  });

  it("должен показывать счётчик активных фильтров", async () => {
    const mockOnFilterChange = vi.fn();
    const { container } = render(
      <AdvancedFilter onFilterChange={mockOnFilterChange} />
    );

    const button = screen.getByRole("button", { name: /фильтры/i });
    fireEvent.click(button);

    const inputs = container.querySelectorAll("input[type='number']");
    if (inputs.length > 0) {
      await userEvent.type(inputs[0], "50");

      // Проверяем, что счётчик обновился
      const badge = container.querySelector("span");
      expect(badge?.textContent).toBe("1");
    }
  });

  it("должен сбрасывать фильтры при клике на Сбросить", async () => {
    const mockOnFilterChange = vi.fn();
    const { container } = render(
      <AdvancedFilter onFilterChange={mockOnFilterChange} />
    );

    const button = screen.getByRole("button", { name: /фильтры/i });
    fireEvent.click(button);

    const inputs = container.querySelectorAll("input[type='number']");
    if (inputs.length > 0) {
      await userEvent.type(inputs[0], "50");

      const resetButton = screen.getByRole("button", { name: /сбросить/i });
      fireEvent.click(resetButton);

      expect(mockOnFilterChange).toHaveBeenCalledWith({});
    }
  });

  it("должен закрывать панель при клике на Применить", async () => {
    const mockOnFilterChange = vi.fn();
    render(<AdvancedFilter onFilterChange={mockOnFilterChange} />);

    const button = screen.getByRole("button", { name: /фильтры/i });
    fireEvent.click(button);

    const applyButton = screen.getByRole("button", { name: /применить/i });
    fireEvent.click(applyButton);

    // Панель должна закрыться
    const heading = screen.queryByText("Расширенные фильтры");
    expect(heading).not.toBeInTheDocument();
  });

  it("должен удалять фильтр при очистке поля", async () => {
    const mockOnFilterChange = vi.fn();
    const { container } = render(
      <AdvancedFilter onFilterChange={mockOnFilterChange} />
    );

    const button = screen.getByRole("button", { name: /фильтры/i });
    fireEvent.click(button);

    const inputs = container.querySelectorAll("input[type='number']");
    if (inputs.length > 0) {
      const input = inputs[0] as HTMLInputElement;
      await userEvent.type(input, "50");
      await userEvent.clear(input);

      expect(mockOnFilterChange).toHaveBeenCalledWith({});
    }
  });
});
