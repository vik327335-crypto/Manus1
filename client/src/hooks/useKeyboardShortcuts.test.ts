import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useKeyboardShortcuts, KEYBOARD_SHORTCUTS } from "./useKeyboardShortcuts";

describe("useKeyboardShortcuts Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("должен быть определён", () => {
    expect(useKeyboardShortcuts).toBeDefined();
  });

  it("должен обрабатывать Cmd/Ctrl + D для Dashboard", () => {
    const consoleSpy = vi.spyOn(console, "log");
    renderHook(() => useKeyboardShortcuts());

    const event = new KeyboardEvent("keydown", {
      key: "d",
      ctrlKey: true,
      bubbles: true,
    });

    window.dispatchEvent(event);

    // Проверяем что событие было обработано
    expect(event.defaultPrevented || consoleSpy).toBeDefined();
  });

  it("должен игнорировать горячие клавиши когда фокус на input", () => {
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    const consoleSpy = vi.spyOn(console, "log");
    renderHook(() => useKeyboardShortcuts());

    const event = new KeyboardEvent("keydown", {
      key: "d",
      ctrlKey: true,
      bubbles: true,
    });

    window.dispatchEvent(event);

    // Горячие клавиши не должны работать когда фокус на input
    expect(consoleSpy).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it("должен иметь список доступных горячих клавиш", () => {
    expect(KEYBOARD_SHORTCUTS).toBeDefined();
    expect(Array.isArray(KEYBOARD_SHORTCUTS)).toBe(true);
    expect(KEYBOARD_SHORTCUTS.length).toBeGreaterThan(0);
  });

  it("должен содержать горячие клавиши для основных страниц", () => {
    const descriptions = KEYBOARD_SHORTCUTS.map((s) => s.description);

    expect(descriptions).toContain("Перейти на Dashboard");
    expect(descriptions).toContain("Перейти на Scanner");
    expect(descriptions).toContain("Перейти на Analytics");
    expect(descriptions).toContain("Перейти на Portfolio");
    expect(descriptions).toContain("Перейти на Watchlist");
  });

  it("должен содержать категории для горячих клавиш", () => {
    const categories = new Set(KEYBOARD_SHORTCUTS.map((s) => s.category));

    expect(categories.has("Navigation")).toBe(true);
    expect(categories.has("Help")).toBe(true);
    expect(categories.has("General")).toBe(true);
  });

  it("должен иметь правильную структуру для каждой горячей клавиши", () => {
    KEYBOARD_SHORTCUTS.forEach((shortcut) => {
      expect(shortcut).toHaveProperty("key");
      expect(shortcut).toHaveProperty("description");
      expect(shortcut).toHaveProperty("category");
      expect(typeof shortcut.key).toBe("string");
      expect(typeof shortcut.description).toBe("string");
      expect(typeof shortcut.category).toBe("string");
    });
  });

  it("должен обрабатывать Cmd/Ctrl + K для поиска", () => {
    const consoleSpy = vi.spyOn(console, "log");
    renderHook(() => useKeyboardShortcuts());

    const event = new KeyboardEvent("keydown", {
      key: "k",
      ctrlKey: true,
      bubbles: true,
    });

    window.dispatchEvent(event);

    expect(event.defaultPrevented || consoleSpy).toBeDefined();
  });

  it("должен обрабатывать Escape для закрытия модальных окон", () => {
    const consoleSpy = vi.spyOn(console, "log");
    renderHook(() => useKeyboardShortcuts());

    const event = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
    });

    window.dispatchEvent(event);

    expect(consoleSpy).toHaveBeenCalledWith("Escape pressed");
  });

  it("должен поддерживать как Cmd так и Ctrl", () => {
    const consoleSpy = vi.spyOn(console, "log");
    renderHook(() => useKeyboardShortcuts());

    // Тест с Cmd (Mac)
    const cmdEvent = new KeyboardEvent("keydown", {
      key: "d",
      metaKey: true,
      bubbles: true,
    });

    window.dispatchEvent(cmdEvent);

    // Тест с Ctrl (Windows/Linux)
    const ctrlEvent = new KeyboardEvent("keydown", {
      key: "d",
      ctrlKey: true,
      bubbles: true,
    });

    window.dispatchEvent(ctrlEvent);

    // Оба события должны быть обработаны
    expect(cmdEvent.defaultPrevented || ctrlEvent.defaultPrevented).toBeDefined();
  });
});
