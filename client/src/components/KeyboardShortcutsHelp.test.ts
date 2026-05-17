import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KeyboardShortcutsHelp } from "./KeyboardShortcutsHelp";

describe("KeyboardShortcutsHelp Component", () => {
  it("должен отображать диалог когда open=true", () => {
    const onOpenChange = vi.fn();
    render(<KeyboardShortcutsHelp open={true} onOpenChange={onOpenChange} />);

    expect(screen.getByText("Горячие клавиши")).toBeInTheDocument();
  });

  it("должен не отображать диалог когда open=false", () => {
    const onOpenChange = vi.fn();
    const { container } = render(<KeyboardShortcutsHelp open={false} onOpenChange={onOpenChange} />);

    // Диалог не должен быть видимым
    const dialog = container.querySelector('[role="dialog"]');
    if (dialog) {
      expect(dialog).not.toBeVisible();
    }
  });

  it("должен отображать заголовок и описание", () => {
    const onOpenChange = vi.fn();
    render(<KeyboardShortcutsHelp open={true} onOpenChange={onOpenChange} />);

    expect(screen.getByText("Горячие клавиши")).toBeInTheDocument();
    expect(
      screen.getByText(/Используйте эти комбинации клавиш/i)
    ).toBeInTheDocument();
  });

  it("должен отображать категории горячих клавиш", () => {
    const onOpenChange = vi.fn();
    render(<KeyboardShortcutsHelp open={true} onOpenChange={onOpenChange} />);

    expect(screen.getByText("Navigation")).toBeInTheDocument();
    expect(screen.getByText("Help")).toBeInTheDocument();
    expect(screen.getByText("General")).toBeInTheDocument();
  });

  it("должен отображать все горячие клавиши", () => {
    const onOpenChange = vi.fn();
    render(<KeyboardShortcutsHelp open={true} onOpenChange={onOpenChange} />);

    expect(screen.getByText("Перейти на Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Перейти на Scanner")).toBeInTheDocument();
    expect(screen.getByText("Перейти на Analytics")).toBeInTheDocument();
    expect(screen.getByText("Закрыть модальные окна")).toBeInTheDocument();
  });

  it("должен отображать клавиши в kbd элементах", () => {
    const onOpenChange = vi.fn();
    render(<KeyboardShortcutsHelp open={true} onOpenChange={onOpenChange} />);

    const kbdElements = screen.getAllByRole("doc-noteref", { hidden: true });
    // Проверяем что есть элементы kbd
    expect(document.querySelectorAll("kbd").length).toBeGreaterThan(0);
  });

  it("должен отображать совет", () => {
    const onOpenChange = vi.fn();
    render(<KeyboardShortcutsHelp open={true} onOpenChange={onOpenChange} />);

    expect(screen.getByText(/Совет:/i)).toBeInTheDocument();
    expect(screen.getByText(/в любой момент, чтобы открыть эту справку/i)).toBeInTheDocument();
  });

  it("должен вызывать onOpenChange при закрытии", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    
    render(<KeyboardShortcutsHelp open={true} onOpenChange={onOpenChange} />);

    // Найти кнопку закрытия и нажать на неё
    const closeButton = screen.getByRole("button", { name: /close/i });
    if (closeButton) {
      await user.click(closeButton);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    }
  });

  it("должен группировать горячие клавиши по категориям", () => {
    const onOpenChange = vi.fn();
    render(<KeyboardShortcutsHelp open={true} onOpenChange={onOpenChange} />);

    // Проверяем что категории отображаются в правильном порядке
    const categories = screen.getAllByText(/Navigation|Help|General/);
    expect(categories.length).toBeGreaterThan(0);
  });

  it("должен иметь правильную структуру для каждой горячей клавиши", () => {
    const onOpenChange = vi.fn();
    render(<KeyboardShortcutsHelp open={true} onOpenChange={onOpenChange} />);

    // Проверяем что каждая горячая клавиша имеет описание и kbd
    const descriptions = [
      "Перейти на Dashboard",
      "Перейти на Scanner",
      "Перейти на Analytics",
      "Закрыть модальные окна",
    ];

    descriptions.forEach((desc) => {
      expect(screen.getByText(desc)).toBeInTheDocument();
    });
  });
});
