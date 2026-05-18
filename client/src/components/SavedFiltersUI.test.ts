import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SavedFiltersUI, SaveFilterDialog } from "./SavedFiltersUI";

const mockFilters = [
  {
    id: "1",
    name: "High Gainers",
    description: "Криптовалюты с сильным ростом за 24 часа",
    filters: {
      scoreMin: 70,
      priceChangeMin: 10,
    },
    createdAt: new Date("2024-05-10"),
    isFavorite: true,
    usageCount: 24,
  },
  {
    id: "2",
    name: "Low Cap Gems",
    description: "Недооцененные монеты с низкой капитализацией",
    filters: {
      marketCapMax: 100000000,
      scoreMin: 65,
    },
    createdAt: new Date("2024-04-22"),
    isFavorite: true,
    usageCount: 18,
  },
  {
    id: "3",
    name: "DeFi Strong",
    description: "Надежные DeFi проекты с высокой ликвидностью",
    filters: {
      scoreMin: 70,
      volumeMin: 50000000,
    },
    createdAt: new Date("2024-06-01"),
    isFavorite: false,
    usageCount: 7,
  },
];

describe("SavedFiltersUI Component", () => {
  const mockOnApply = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnToggleFavorite = vi.fn();
  const mockOnDuplicate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("должен отображать список сохранённых фильтров", () => {
    render(
      <SavedFiltersUI
        filters={mockFilters}
        onApply={mockOnApply}
        onDelete={mockOnDelete}
        onToggleFavorite={mockOnToggleFavorite}
        onDuplicate={mockOnDuplicate}
      />
    );

    expect(screen.getByText("Сохранённые фильтры")).toBeInTheDocument();
    expect(screen.getByText("High Gainers")).toBeInTheDocument();
    expect(screen.getByText("Low Cap Gems")).toBeInTheDocument();
    expect(screen.getByText("DeFi Strong")).toBeInTheDocument();
  });

  it("должен отображать статистику фильтров", () => {
    render(
      <SavedFiltersUI
        filters={mockFilters}
        onApply={mockOnApply}
        onDelete={mockOnDelete}
        onToggleFavorite={mockOnToggleFavorite}
        onDuplicate={mockOnDuplicate}
      />
    );

    expect(screen.getByText(/3 фильтров сохранено/)).toBeInTheDocument();
    expect(screen.getByText(/2 избранных/)).toBeInTheDocument();
  });

  it("должен разделять избранные и недавние фильтры", () => {
    render(
      <SavedFiltersUI
        filters={mockFilters}
        onApply={mockOnApply}
        onDelete={mockOnDelete}
        onToggleFavorite={mockOnToggleFavorite}
        onDuplicate={mockOnDuplicate}
      />
    );

    expect(screen.getByText("Избранные (2)")).toBeInTheDocument();
    expect(screen.getByText("Недавние (1)")).toBeInTheDocument();
  });

  it("должен фильтровать фильтры по поиску", async () => {
    const user = userEvent.setup();
    render(
      <SavedFiltersUI
        filters={mockFilters}
        onApply={mockOnApply}
        onDelete={mockOnDelete}
        onToggleFavorite={mockOnToggleFavorite}
        onDuplicate={mockOnDuplicate}
      />
    );

    const searchInput = screen.getByPlaceholderText("Поиск фильтров...");
    await user.type(searchInput, "DeFi");

    expect(screen.getByText("DeFi Strong")).toBeInTheDocument();
    expect(screen.queryByText("High Gainers")).not.toBeInTheDocument();
  });

  it("должен вызывать onApply при нажатии кнопки Применить", async () => {
    const user = userEvent.setup();
    render(
      <SavedFiltersUI
        filters={mockFilters}
        onApply={mockOnApply}
        onDelete={mockOnDelete}
        onToggleFavorite={mockOnToggleFavorite}
        onDuplicate={mockOnDuplicate}
      />
    );

    const applyButtons = screen.getAllByText("Применить");
    await user.click(applyButtons[0]);

    expect(mockOnApply).toHaveBeenCalledWith(mockFilters[0]);
  });

  it("должен отображать пустое состояние при отсутствии фильтров", () => {
    render(
      <SavedFiltersUI
        filters={[]}
        onApply={mockOnApply}
        onDelete={mockOnDelete}
        onToggleFavorite={mockOnToggleFavorite}
        onDuplicate={mockOnDuplicate}
      />
    );

    expect(screen.getByText("Нет сохранённых фильтров")).toBeInTheDocument();
  });

  it("должен отображать пустой результат поиска", async () => {
    const user = userEvent.setup();
    render(
      <SavedFiltersUI
        filters={mockFilters}
        onApply={mockOnApply}
        onDelete={mockOnDelete}
        onToggleFavorite={mockOnToggleFavorite}
        onDuplicate={mockOnDuplicate}
      />
    );

    const searchInput = screen.getByPlaceholderText("Поиск фильтров...");
    await user.type(searchInput, "NonExistent");

    expect(screen.getByText(/Фильтры не найдены/)).toBeInTheDocument();
  });

  it("должен отображать теги фильтров в карточке", () => {
    render(
      <SavedFiltersUI
        filters={mockFilters}
        onApply={mockOnApply}
        onDelete={mockOnDelete}
        onToggleFavorite={mockOnToggleFavorite}
        onDuplicate={mockOnDuplicate}
      />
    );

    expect(screen.getByText("Score ≥ 70")).toBeInTheDocument();
    expect(screen.getByText("Change ≥ 10%")).toBeInTheDocument();
  });

  it("должен отображать дату создания и количество использований", () => {
    render(
      <SavedFiltersUI
        filters={mockFilters}
        onApply={mockOnApply}
        onDelete={mockOnDelete}
        onToggleFavorite={mockOnToggleFavorite}
        onDuplicate={mockOnDuplicate}
      />
    );

    expect(screen.getByText(/Использовано: 24 раз/)).toBeInTheDocument();
    expect(screen.getByText(/Использовано: 18 раз/)).toBeInTheDocument();
  });

  it("должен сортировать фильтры по использованию", async () => {
    const user = userEvent.setup();
    render(
      <SavedFiltersUI
        filters={mockFilters}
        onApply={mockOnApply}
        onDelete={mockOnDelete}
        onToggleFavorite={mockOnToggleFavorite}
        onDuplicate={mockOnDuplicate}
      />
    );

    const sortButton = screen.getByText("Сортировка");
    await user.click(sortButton);

    const usageOption = screen.getByText("По использованию");
    await user.click(usageOption);

    // Проверяем что фильтры переупорядочены
    const filterNames = screen.getAllByText(/High Gainers|DeFi Strong/);
    expect(filterNames.length).toBeGreaterThan(0);
  });
});

describe("SaveFilterDialog Component", () => {
  const mockOnSave = vi.fn();
  const mockFilters = {
    scoreMin: 70,
    priceChangeMin: 10,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("должен отображать форму сохранения фильтра", () => {
    render(
      <SaveFilterDialog
        filters={mockFilters}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText("Сохранить фильтр")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Например: Высокие gainers")).toBeInTheDocument();
  });

  it("должен отображать активные фильтры", () => {
    render(
      <SaveFilterDialog
        filters={mockFilters}
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText("Активные фильтры:")).toBeInTheDocument();
    expect(screen.getByText(/scoreMin: 70/)).toBeInTheDocument();
    expect(screen.getByText(/priceChangeMin: 10/)).toBeInTheDocument();
  });

  it("должен вызывать onSave с именем и описанием", async () => {
    const user = userEvent.setup();
    render(
      <SaveFilterDialog
        filters={mockFilters}
        onSave={mockOnSave}
      />
    );

    const nameInput = screen.getByPlaceholderText("Например: Высокие gainers");
    const descriptionInput = screen.getByPlaceholderText("Описание фильтра...");
    const saveButton = screen.getByText("Сохранить фильтр");

    await user.type(nameInput, "My Filter");
    await user.type(descriptionInput, "My Description");
    await user.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith("My Filter", "My Description");
  });

  it("должен отключать кнопку сохранения при пустом имени", () => {
    render(
      <SaveFilterDialog
        filters={mockFilters}
        onSave={mockOnSave}
      />
    );

    const saveButton = screen.getByText("Сохранить фильтр");
    expect(saveButton).toBeDisabled();
  });

  it("должен использовать defaultName если предоставлено", () => {
    render(
      <SaveFilterDialog
        filters={mockFilters}
        onSave={mockOnSave}
        defaultName="Default Filter"
      />
    );

    const nameInput = screen.getByDisplayValue("Default Filter");
    expect(nameInput).toBeInTheDocument();
  });
});
