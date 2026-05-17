import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MobileNavigation, MobileNavigationPadding } from "./MobileNavigation";

// Mock useIsMobile
vi.mock("@/hooks/useMobile", () => ({
  useIsMobile: vi.fn(() => true),
}));

// Mock useLocation
vi.mock("wouter", () => ({
  useLocation: () => ["/", vi.fn()],
}));

describe("MobileNavigation Component", () => {
  it("должен отображать навигацию на мобильных устройствах", () => {
    render(<MobileNavigation />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Scanner")).toBeInTheDocument();
    expect(screen.getByText("Analytics")).toBeInTheDocument();
  });

  it("должен иметь все пункты меню", () => {
    render(<MobileNavigation />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Scanner")).toBeInTheDocument();
    expect(screen.getByText("Analytics")).toBeInTheDocument();
    expect(screen.getByText("Portfolio")).toBeInTheDocument();
    expect(screen.getByText("Watchlist")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("должен отмечать активный пункт меню", () => {
    render(<MobileNavigation />);

    const dashboardBtn = screen.getByRole("button", { name: "Dashboard" });
    expect(dashboardBtn).toHaveAttribute("aria-current", "page");
  });

  it("должен иметь правильные aria-label атрибуты", () => {
    render(<MobileNavigation />);

    expect(screen.getByRole("button", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Scanner" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Analytics" })).toBeInTheDocument();
  });

  it("должен быть зафиксирован внизу экрана", () => {
    const { container } = render(<MobileNavigation />);

    const nav = container.querySelector("nav");
    expect(nav).toHaveClass("fixed");
    expect(nav).toHaveClass("bottom-0");
  });

  it("должен иметь правильную высоту", () => {
    const { container } = render(<MobileNavigation />);

    const nav = container.querySelector("nav");
    expect(nav).toHaveClass("h-16");
  });

  it("должен иметь правильный z-index", () => {
    const { container } = render(<MobileNavigation />);

    const nav = container.querySelector("nav");
    expect(nav).toHaveClass("z-40");
  });

  it("должен иметь иконки для каждого пункта", () => {
    const { container } = render(<MobileNavigation />);

    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBe(6);

    buttons.forEach(button => {
      const svg = button.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });
});

describe("MobileNavigationPadding Component", () => {
  it("должен отображать padding на мобильных устройствах", () => {
    const { container } = render(<MobileNavigationPadding />);

    const padding = container.firstChild;
    expect(padding).toHaveClass("h-20");
  });

  it("должен иметь правильный класс высоты", () => {
    const { container } = render(<MobileNavigationPadding />);

    const padding = container.firstChild;
    expect(padding).toHaveClass("h-20");
  });
});
