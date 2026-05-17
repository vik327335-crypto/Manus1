import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  ResponsiveGrid,
  ResponsiveContainer,
  ResponsiveStack,
  ResponsiveHidden,
} from "./ResponsiveGrid";

describe("ResponsiveGrid Component", () => {
  it("должен отображать сетку с дочерними элементами", () => {
    render(
      <ResponsiveGrid>
        <div>Item 1</div>
        <div>Item 2</div>
        <div>Item 3</div>
      </ResponsiveGrid>
    );

    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
    expect(screen.getByText("Item 3")).toBeInTheDocument();
  });

  it("должен применять правильные классы сетки", () => {
    const { container } = render(
      <ResponsiveGrid cols={{ xs: 1, sm: 2, md: 3 }}>
        <div>Item</div>
      </ResponsiveGrid>
    );

    const grid = container.firstChild;
    expect(grid).toHaveClass("grid");
    expect(grid).toHaveClass("grid-cols-1");
  });

  it("должен применять правильный gap", () => {
    const { container } = render(
      <ResponsiveGrid gap="lg">
        <div>Item</div>
      </ResponsiveGrid>
    );

    const grid = container.firstChild;
    expect(grid).toHaveClass("gap-6");
  });

  it("должен применять пользовательский className", () => {
    const { container } = render(
      <ResponsiveGrid className="custom-class">
        <div>Item</div>
      </ResponsiveGrid>
    );

    const grid = container.firstChild;
    expect(grid).toHaveClass("custom-class");
  });
});

describe("ResponsiveContainer Component", () => {
  it("должен отображать контейнер с дочерними элементами", () => {
    render(
      <ResponsiveContainer>
        <div>Content</div>
      </ResponsiveContainer>
    );

    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("должен применять правильные классы контейнера", () => {
    const { container } = render(
      <ResponsiveContainer maxWidth="xl">
        <div>Content</div>
      </ResponsiveContainer>
    );

    const cont = container.firstChild;
    expect(cont).toHaveClass("w-full");
    expect(cont).toHaveClass("mx-auto");
    expect(cont).toHaveClass("max-w-xl");
  });

  it("должен применять padding", () => {
    const { container } = render(
      <ResponsiveContainer>
        <div>Content</div>
      </ResponsiveContainer>
    );

    const cont = container.firstChild;
    expect(cont).toHaveClass("px-4");
    expect(cont).toHaveClass("sm:px-6");
    expect(cont).toHaveClass("md:px-8");
  });
});

describe("ResponsiveStack Component", () => {
  it("должен отображать стек с дочерними элементами", () => {
    render(
      <ResponsiveStack>
        <div>Item 1</div>
        <div>Item 2</div>
      </ResponsiveStack>
    );

    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
  });

  it("должен применять flex-col по умолчанию", () => {
    const { container } = render(
      <ResponsiveStack>
        <div>Item</div>
      </ResponsiveStack>
    );

    const stack = container.firstChild;
    expect(stack).toHaveClass("flex");
    expect(stack).toHaveClass("flex-col");
  });

  it("должен применять flex-row при direction='row'", () => {
    const { container } = render(
      <ResponsiveStack direction="row">
        <div>Item</div>
      </ResponsiveStack>
    );

    const stack = container.firstChild;
    expect(stack).toHaveClass("flex");
    expect(stack).toHaveClass("flex-row");
  });

  it("должен применять правильный spacing", () => {
    const { container } = render(
      <ResponsiveStack spacing="lg">
        <div>Item</div>
      </ResponsiveStack>
    );

    const stack = container.firstChild;
    expect(stack).toHaveClass("space-y-6");
  });

  it("должен быть адаптивным при responsive=true", () => {
    const { container } = render(
      <ResponsiveStack direction="row" responsive>
        <div>Item</div>
      </ResponsiveStack>
    );

    const stack = container.firstChild;
    expect(stack).toHaveClass("flex-col");
    expect(stack).toHaveClass("sm:flex-row");
  });
});

describe("ResponsiveHidden Component", () => {
  it("должен отображать дочерние элементы", () => {
    render(
      <ResponsiveHidden>
        <div>Content</div>
      </ResponsiveHidden>
    );

    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("должен скрывать элемент на xs", () => {
    const { container } = render(
      <ResponsiveHidden hideOn={["xs"]}>
        <div>Content</div>
      </ResponsiveHidden>
    );

    const hidden = container.firstChild;
    expect(hidden).toHaveClass("hidden");
  });

  it("должен показывать элемент на sm", () => {
    const { container } = render(
      <ResponsiveHidden showOn={["sm"]}>
        <div>Content</div>
      </ResponsiveHidden>
    );

    const hidden = container.firstChild;
    expect(hidden).toHaveClass("hidden");
    expect(hidden).toHaveClass("sm:block");
  });

  it("должен применять несколько breakpoints", () => {
    const { container } = render(
      <ResponsiveHidden hideOn={["xs", "sm"]}>
        <div>Content</div>
      </ResponsiveHidden>
    );

    const hidden = container.firstChild;
    expect(hidden).toHaveClass("hidden");
    expect(hidden).toHaveClass("sm:hidden");
  });
});
