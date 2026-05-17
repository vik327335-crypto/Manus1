import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccessibilityProvider } from "./AccessibilityProvider";

describe("AccessibilityProvider Component", () => {
  beforeEach(() => {
    // Очищаем классы с документа перед каждым тестом
    document.documentElement.className = "";
  });

  it("должен отображать дочерний контент", () => {
    render(
      <AccessibilityProvider>
        <div>Test Content</div>
      </AccessibilityProvider>
    );

    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("должен отображать кнопку доступности", () => {
    render(
      <AccessibilityProvider>
        <div>Test</div>
      </AccessibilityProvider>
    );

    const button = screen.getByLabelText("Настройки доступности");
    expect(button).toBeInTheDocument();
  });

  it("должен открывать/закрывать меню доступности", async () => {
    const user = userEvent.setup();
    render(
      <AccessibilityProvider>
        <div>Test</div>
      </AccessibilityProvider>
    );

    const button = screen.getByLabelText("Настройки доступности");

    // Открываем меню
    await user.click(button);
    expect(screen.getByText("Размер шрифта")).toBeInTheDocument();

    // Закрываем меню
    await user.click(button);
    await waitFor(() => {
      expect(screen.queryByText("Размер шрифта")).not.toBeInTheDocument();
    });
  });

  it("должен переключать высокий контраст", async () => {
    const user = userEvent.setup();
    render(
      <AccessibilityProvider>
        <div>Test</div>
      </AccessibilityProvider>
    );

    const button = screen.getByLabelText("Настройки доступности");
    await user.click(button);

    const checkbox = screen.getByLabelText("Высокий контраст");
    await user.click(checkbox);

    await waitFor(() => {
      expect(document.documentElement.classList.contains("high-contrast")).toBe(true);
    });
  });

  it("должен изменять размер шрифта", async () => {
    const user = userEvent.setup();
    render(
      <AccessibilityProvider>
        <div>Test</div>
      </AccessibilityProvider>
    );

    const button = screen.getByLabelText("Настройки доступности");
    await user.click(button);

    const select = screen.getByLabelText("Выберите размер шрифта");
    await user.selectOption(select, "large");

    await waitFor(() => {
      expect(document.documentElement.style.fontSize).toBe("18px");
    });
  });

  it("должен иметь правильные ARIA атрибуты", () => {
    render(
      <AccessibilityProvider>
        <div>Test</div>
      </AccessibilityProvider>
    );

    const app = screen.getByRole("application");
    expect(app).toHaveAttribute("aria-label", "CAN SLIM Crypto Scanner");
  });

  it("должен отображать справку по навигации", async () => {
    const user = userEvent.setup();
    render(
      <AccessibilityProvider>
        <div>Test</div>
      </AccessibilityProvider>
    );

    const button = screen.getByLabelText("Настройки доступности");
    await user.click(button);

    expect(screen.getByText(/Используйте Tab для навигации/)).toBeInTheDocument();
    expect(screen.getByText(/Используйте Enter для активации кнопок/)).toBeInTheDocument();
  });

  it("должен поддерживать все размеры шрифта", async () => {
    const user = userEvent.setup();
    render(
      <AccessibilityProvider>
        <div>Test</div>
      </AccessibilityProvider>
    );

    const button = screen.getByLabelText("Настройки доступности");
    await user.click(button);

    const select = screen.getByLabelText("Выберите размер шрифта");

    // Проверяем нормальный размер
    await user.selectOption(select, "normal");
    await waitFor(() => {
      expect(document.documentElement.style.fontSize).toBe("16px");
    });

    // Проверяем большой размер
    await user.selectOption(select, "large");
    await waitFor(() => {
      expect(document.documentElement.style.fontSize).toBe("18px");
    });

    // Проверяем очень большой размер
    await user.selectOption(select, "extra-large");
    await waitFor(() => {
      expect(document.documentElement.style.fontSize).toBe("20px");
    });
  });

  it("должен иметь aria-expanded атрибут на кнопке меню", async () => {
    const user = userEvent.setup();
    render(
      <AccessibilityProvider>
        <div>Test</div>
      </AccessibilityProvider>
    );

    const button = screen.getByLabelText("Настройки доступности");
    expect(button).toHaveAttribute("aria-expanded", "false");

    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
  });

  it("должен иметь aria-controls атрибут на кнопке меню", () => {
    render(
      <AccessibilityProvider>
        <div>Test</div>
      </AccessibilityProvider>
    );

    const button = screen.getByLabelText("Настройки доступности");
    expect(button).toHaveAttribute("aria-controls", "accessibility-menu");
  });

  it("должен применять класс reduce-motion при необходимости", () => {
    // Мокируем matchMedia
    const mockMatchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    window.matchMedia = mockMatchMedia;

    render(
      <AccessibilityProvider>
        <div>Test</div>
      </AccessibilityProvider>
    );

    // Проверяем что класс применён
    expect(document.documentElement.classList.contains("reduce-motion")).toBe(true);
  });
});
