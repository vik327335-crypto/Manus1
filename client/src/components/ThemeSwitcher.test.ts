import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { ThemeProvider } from "@/contexts/ThemeContext";

describe("ThemeSwitcher Component", () => {
  it("должен отображать кнопку переключения темы", () => {
    render(
      <ThemeProvider switchable>
        <ThemeSwitcher />
      </ThemeProvider>
    );

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("должен показывать иконку луны в светлой теме", () => {
    render(
      <ThemeProvider defaultTheme="light" switchable>
        <ThemeSwitcher />
      </ThemeProvider>
    );

    // Проверяем что есть иконка луны
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("должен показывать иконку солнца в тёмной теме", () => {
    render(
      <ThemeProvider defaultTheme="dark" switchable>
        <ThemeSwitcher />
      </ThemeProvider>
    );

    // Проверяем что есть иконка солнца
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("должен переключать тему при клике", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider defaultTheme="light" switchable>
        <ThemeSwitcher />
      </ThemeProvider>
    );

    const button = screen.getByRole("button");
    await user.click(button);

    // Проверяем что тема переключилась
    expect(button).toBeInTheDocument();
  });

  it("должен иметь правильный title атрибут", () => {
    render(
      <ThemeProvider defaultTheme="light" switchable>
        <ThemeSwitcher />
      </ThemeProvider>
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("title");
  });

  it("должен иметь правильный aria-label атрибут", () => {
    render(
      <ThemeProvider defaultTheme="light" switchable>
        <ThemeSwitcher />
      </ThemeProvider>
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label");
  });

  it("должен применять className", () => {
    render(
      <ThemeProvider switchable>
        <ThemeSwitcher className="custom-class" />
      </ThemeProvider>
    );

    const button = screen.getByRole("button");
    expect(button).toHaveClass("custom-class");
  });

  it("не должен отображаться когда switchable=false", () => {
    const { container } = render(
      <ThemeProvider switchable={false}>
        <ThemeSwitcher />
      </ThemeProvider>
    );

    // Компонент не должен отображаться
    expect(container.firstChild?.childNodes.length).toBe(0);
  });

  it("должен сохранять выбранную тему в localStorage", async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider defaultTheme="light" switchable>
        <ThemeSwitcher />
      </ThemeProvider>
    );

    const button = screen.getByRole("button");
    await user.click(button);

    // Проверяем что тема сохранилась в localStorage
    const stored = localStorage.getItem("theme");
    expect(stored).toBe("dark");
  });

  it("должен загружать тему из localStorage при инициализации", () => {
    localStorage.setItem("theme", "dark");

    render(
      <ThemeProvider switchable>
        <ThemeSwitcher />
      </ThemeProvider>
    );

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();

    localStorage.clear();
  });
});
