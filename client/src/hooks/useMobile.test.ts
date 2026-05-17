import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIsMobile, useBreakpoint, useOrientation } from "./useMobile";

describe("useMobile Hook", () => {
  beforeEach(() => {
    // Устанавливаем начальный размер окна
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("должен вернуть false для больших экранов", () => {
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("должен вернуть true для маленьких экранов", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 500,
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("должен обновляться при изменении размера окна", () => {
    const { result, rerender } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);

    act(() => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 500,
      });
      window.dispatchEvent(new Event("resize"));
    });

    rerender();
    expect(result.current).toBe(true);
  });
});

describe("useBreakpoint Hook", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("должен вернуть 'xs' для очень маленьких экранов", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 300,
    });

    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe("xs");
  });

  it("должен вернуть 'sm' для маленьких экранов", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 700,
    });

    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe("sm");
  });

  it("должен вернуть 'md' для средних экранов", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 900,
    });

    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe("md");
  });

  it("должен вернуть 'lg' для больших экранов", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1100,
    });

    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe("lg");
  });

  it("должен вернуть 'xl' для очень больших экранов", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1400,
    });

    const { result } = renderHook(() => useBreakpoint());
    expect(result.current).toBe("xl");
  });
});

describe("useOrientation Hook", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 768,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("должен вернуть 'landscape' для широких экранов", () => {
    const { result } = renderHook(() => useOrientation());
    expect(result.current).toBe("landscape");
  });

  it("должен вернуть 'portrait' для высоких экранов", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 400,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 800,
    });

    const { result } = renderHook(() => useOrientation());
    expect(result.current).toBe("portrait");
  });

  it("должен обновляться при изменении ориентации", () => {
    const { result, rerender } = renderHook(() => useOrientation());

    expect(result.current).toBe("landscape");

    act(() => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 400,
      });
      Object.defineProperty(window, "innerHeight", {
        writable: true,
        configurable: true,
        value: 800,
      });
      window.dispatchEvent(new Event("orientationchange"));
    });

    rerender();
    expect(result.current).toBe("portrait");
  });
});
