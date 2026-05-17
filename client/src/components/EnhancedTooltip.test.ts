import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  EnhancedTooltip,
  TooltipIcon,
  TooltipLabel,
  TooltipHelp,
  TooltipButton,
} from "./EnhancedTooltip";

describe("EnhancedTooltip Component", () => {
  it("должен отображать дочерний элемент", () => {
    render(
      <EnhancedTooltip content="Подсказка">
        <button>Hover me</button>
      </EnhancedTooltip>
    );

    expect(screen.getByText("Hover me")).toBeInTheDocument();
  });

  it("должен показывать подсказку при наведении", async () => {
    const user = userEvent.setup();
    render(
      <EnhancedTooltip content="Подсказка">
        <button>Hover me</button>
      </EnhancedTooltip>
    );

    const button = screen.getByText("Hover me");
    await user.hover(button);

    await waitFor(() => {
      expect(screen.getByText("Подсказка")).toBeInTheDocument();
    });
  });

  it("должен скрывать подсказку при отведении мыши", async () => {
    const user = userEvent.setup();
    render(
      <EnhancedTooltip content="Подсказка">
        <button>Hover me</button>
      </EnhancedTooltip>
    );

    const button = screen.getByText("Hover me");
    await user.hover(button);

    await waitFor(() => {
      expect(screen.getByText("Подсказка")).toBeInTheDocument();
    });

    await user.unhover(button);

    await waitFor(() => {
      expect(screen.queryByText("Подсказка")).not.toBeInTheDocument();
    });
  });

  it("должен поддерживать разные позиции", () => {
    const { rerender } = render(
      <EnhancedTooltip content="Подсказка" side="top">
        <button>Hover me</button>
      </EnhancedTooltip>
    );

    expect(screen.getByText("Hover me")).toBeInTheDocument();

    rerender(
      <EnhancedTooltip content="Подсказка" side="bottom">
        <button>Hover me</button>
      </EnhancedTooltip>
    );

    expect(screen.getByText("Hover me")).toBeInTheDocument();
  });
});

describe("TooltipIcon Component", () => {
  it("должен отображать иконку вопроса", () => {
    render(<TooltipIcon content="Подсказка" />);

    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("должен показывать подсказку при наведении", async () => {
    const user = userEvent.setup();
    render(<TooltipIcon content="Подсказка" />);

    const icon = screen.getByText("?");
    await user.hover(icon);

    await waitFor(() => {
      expect(screen.getByText("Подсказка")).toBeInTheDocument();
    });
  });

  it("должен иметь правильные классы", () => {
    const { container } = render(<TooltipIcon content="Подсказка" />);

    const icon = container.querySelector("span");
    expect(icon).toHaveClass("inline-flex");
    expect(icon).toHaveClass("cursor-help");
  });
});

describe("TooltipLabel Component", () => {
  it("должен отображать label и иконку", () => {
    render(<TooltipLabel label="Имя" tooltip="Введите ваше имя" />);

    expect(screen.getByText("Имя")).toBeInTheDocument();
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("должен показывать звёздочку для обязательных полей", () => {
    render(
      <TooltipLabel label="Email" tooltip="Введите email" required />
    );

    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("должен показывать подсказку при наведении", async () => {
    const user = userEvent.setup();
    render(<TooltipLabel label="Имя" tooltip="Введите ваше имя" />);

    const icon = screen.getByText("?");
    await user.hover(icon);

    await waitFor(() => {
      expect(screen.getByText("Введите ваше имя")).toBeInTheDocument();
    });
  });
});

describe("TooltipHelp Component", () => {
  it("должен отображать дочерний элемент", () => {
    render(
      <TooltipHelp help="Подсказка">
        Текст с подсказкой
      </TooltipHelp>
    );

    expect(screen.getByText("Текст с подсказкой")).toBeInTheDocument();
  });

  it("должен показывать подсказку при наведении", async () => {
    const user = userEvent.setup();
    render(
      <TooltipHelp help="Подсказка">
        Текст с подсказкой
      </TooltipHelp>
    );

    const text = screen.getByText("Текст с подсказкой");
    await user.hover(text);

    await waitFor(() => {
      expect(screen.getByText("Подсказка")).toBeInTheDocument();
    });
  });

  it("должен иметь стиль подчёркивания", () => {
    const { container } = render(
      <TooltipHelp help="Подсказка">
        Текст
      </TooltipHelp>
    );

    const span = container.querySelector("span");
    expect(span).toHaveClass("border-b");
    expect(span).toHaveClass("border-dotted");
  });
});

describe("TooltipButton Component", () => {
  it("должен отображать кнопку с label", () => {
    render(
      <TooltipButton label="Сохранить" tooltip="Сохранить изменения" />
    );

    expect(screen.getByText("Сохранить")).toBeInTheDocument();
  });

  it("должен вызывать onClick при клике", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <TooltipButton
        label="Сохранить"
        tooltip="Сохранить изменения"
        onClick={onClick}
      />
    );

    const button = screen.getByText("Сохранить");
    await user.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("должен быть отключен при disabled=true", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <TooltipButton
        label="Сохранить"
        tooltip="Сохранить изменения"
        onClick={onClick}
        disabled
      />
    );

    const button = screen.getByText("Сохранить");
    expect(button).toBeDisabled();

    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("должен показывать подсказку при наведении", async () => {
    const user = userEvent.setup();
    render(
      <TooltipButton label="Сохранить" tooltip="Сохранить изменения" />
    );

    const button = screen.getByText("Сохранить");
    await user.hover(button);

    await waitFor(() => {
      expect(screen.getByText("Сохранить изменения")).toBeInTheDocument();
    });
  });
});
