import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EnhancedNavigation } from "./EnhancedNavigation";

// Mock useLocation
vi.mock("wouter", () => ({
  useLocation: () => ["/", vi.fn()],
}));

describe("EnhancedNavigation Component", () => {
  it("должен отображать все пункты меню", () => {
    render(<EnhancedNavigation />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Scanner")).toBeInTheDocument();
  });

  it("должен отображать группы меню", () => {
    render(<EnhancedNavigation />);

    expect(screen.getByText("Основное")).toBeInTheDocument();
    expect(screen.getByText("Анализ")).toBeInTheDocument();
    expect(screen.getByText("Настройки")).toBeInTheDocument();
  });

  it("должен отмечать активный пункт меню", () => {
    render(<EnhancedNavigation />);

    const dashboardLink = screen.getByRole("link", { name: /Dashboard/i });
    expect(dashboardLink).toHaveClass("bg-primary/10");
  });

  it("должен иметь описания для пунктов меню", () => {
    render(<EnhancedNavigation />);

    expect(screen.getByText("Основная информация")).toBeInTheDocument();
    expect(screen.getByText("Сканирование активов")).toBeInTheDocument();
  });

  it("должен отображать кнопку меню на мобильных", () => {
    render(<EnhancedNavigation />);

    const menuButton = screen.getByRole("button", { name: /Menu/i });
    expect(menuButton).toBeInTheDocument();
  });

  it("должен открывать/закрывать мобильное меню", async () => {
    const user = userEvent.setup();
    render(<EnhancedNavigation />);

    const menuButton = screen.getByRole("button", { name: /Menu/i });

    // Открываем меню
    await user.click(menuButton);

    // Проверяем что меню открыто (видны пункты)
    expect(screen.getByText("Основное")).toBeInTheDocument();

    // Закрываем меню
    await user.click(menuButton);

    // Проверяем что меню закрыто
    expect(screen.queryByText("Основное")).not.toBeInTheDocument();
  });

  it("должен иметь правильные иконки для каждого пункта", () => {
    const { container } = render(<EnhancedNavigation />);

    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThan(0);
  });

  it("должен закрывать мобильное меню при клике на пункт", async () => {
    const user = userEvent.setup();
    render(<EnhancedNavigation />);

    const menuButton = screen.getByRole("button", { name: /Menu/i });

    // Открываем меню
    await user.click(menuButton);

    // Кликаем на пункт меню
    const dashboardLink = screen.getAllByRole("link", { name: /Dashboard/i })[1]; // Мобильная версия
    await user.click(dashboardLink);

    // Проверяем что меню закрыто
    expect(screen.queryByText("Основное")).not.toBeInTheDocument();
  });

  it("должен иметь правильные атрибуты title для пунктов", () => {
    render(<EnhancedNavigation />);

    const dashboardLink = screen.getByRole("link", { name: /Dashboard/i });
    expect(dashboardLink).toHaveAttribute("title", "Основная информация");
  });

  it("должен отображать текущий пункт в мобильном меню", () => {
    render(<EnhancedNavigation />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("должен иметь правильные классы для активного пункта", () => {
    render(<EnhancedNavigation />);

    const dashboardLink = screen.getByRole("link", { name: /Dashboard/i });
    expect(dashboardLink).toHaveClass("bg-primary/10");
    expect(dashboardLink).toHaveClass("text-primary");
  });
});
