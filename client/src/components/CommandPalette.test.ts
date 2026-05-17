import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommandPalette } from "./CommandPalette";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { BrowserRouter } from "wouter/use-browser-location";

// Mock useAuth
vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    logout: vi.fn(),
  }),
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ThemeProvider switchable>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </ThemeProvider>
  );
};

describe("CommandPalette Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("должен отображаться при нажатии Cmd/Ctrl + K", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommandPalette />);

    // Нажимаем Cmd/Ctrl + K
    await user.keyboard("{Control>}k{/Control}");

    // Проверяем что палитра открылась
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Поиск команд/i)).toBeInTheDocument();
    });
  });

  it("должен закрываться при нажатии Escape", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommandPalette />);

    // Открываем палитру
    await user.keyboard("{Control>}k{/Control}");

    // Ждём открытия
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Поиск команд/i)).toBeInTheDocument();
    });

    // Закрываем палитру
    await user.keyboard("{Escape}");

    // Проверяем что палитра закрылась
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/Поиск команд/i)).not.toBeInTheDocument();
    });
  });

  it("должен содержать команды навигации", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommandPalette />);

    // Открываем палитру
    await user.keyboard("{Control>}k{/Control}");

    // Ждём открытия
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Поиск команд/i)).toBeInTheDocument();
    });

    // Проверяем наличие команд
    expect(screen.getByText(/На главную/i)).toBeInTheDocument();
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Scanner/i)).toBeInTheDocument();
  });

  it("должен фильтровать команды при вводе", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommandPalette />);

    // Открываем палитру
    await user.keyboard("{Control>}k{/Control}");

    // Ждём открытия
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Поиск команд/i)).toBeInTheDocument();
    });

    // Вводим текст для поиска
    const input = screen.getByPlaceholderText(/Поиск команд/i);
    await user.type(input, "dash");

    // Проверяем что отфильтровались команды
    await waitFor(() => {
      expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    });
  });

  it("должен содержать команду выхода", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommandPalette />);

    // Открываем палитру
    await user.keyboard("{Control>}k{/Control}");

    // Ждём открытия
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Поиск команд/i)).toBeInTheDocument();
    });

    // Проверяем наличие команды выхода
    expect(screen.getByText(/Выход/i)).toBeInTheDocument();
  });

  it("должен содержать команду переключения темы", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommandPalette />);

    // Открываем палитру
    await user.keyboard("{Control>}k{/Control}");

    // Ждём открытия
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Поиск команд/i)).toBeInTheDocument();
    });

    // Проверяем наличие команды переключения темы
    expect(screen.getByText(/Переключить на/i)).toBeInTheDocument();
  });

  it("должен иметь группированные команды", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommandPalette />);

    // Открываем палитру
    await user.keyboard("{Control>}k{/Control}");

    // Ждём открытия
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Поиск команд/i)).toBeInTheDocument();
    });

    // Проверяем наличие групп
    expect(screen.getByText(/Навигация/i)).toBeInTheDocument();
    expect(screen.getByText(/Внешний вид/i)).toBeInTheDocument();
    expect(screen.getByText(/Аккаунт/i)).toBeInTheDocument();
  });

  it("должен закрываться после выбора команды", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommandPalette />);

    // Открываем палитру
    await user.keyboard("{Control>}k{/Control}");

    // Ждём открытия
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Поиск команд/i)).toBeInTheDocument();
    });

    // Кликаем на команду
    const dashboardBtn = screen.getByText(/Dashboard/i);
    await user.click(dashboardBtn);

    // Проверяем что палитра закрылась
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/Поиск команд/i)).not.toBeInTheDocument();
    });
  });

  it("должен показывать описание команд", async () => {
    const user = userEvent.setup();
    renderWithProviders(<CommandPalette />);

    // Открываем палитру
    await user.keyboard("{Control>}k{/Control}");

    // Ждём открытия
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Поиск команд/i)).toBeInTheDocument();
    });

    // Проверяем наличие описаний
    expect(screen.getByText(/Просмотр основной информации/i)).toBeInTheDocument();
    expect(screen.getByText(/Сканирование криптовалют/i)).toBeInTheDocument();
  });
});
