import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange) => void;
  presets?: Array<{
    label: string;
    getValue: () => DateRange;
  }>;
  disabled?: boolean;
}

const defaultPresets = [
  {
    label: 'Сегодня',
    getValue: () => {
      const today = new Date();
      return { from: today, to: today };
    },
  },
  {
    label: 'Последние 7 дней',
    getValue: () => {
      const to = new Date();
      const from = new Date(to);
      from.setDate(from.getDate() - 7);
      return { from, to };
    },
  },
  {
    label: 'Последние 30 дней',
    getValue: () => {
      const to = new Date();
      const from = new Date(to);
      from.setDate(from.getDate() - 30);
      return { from, to };
    },
  },
  {
    label: 'Последние 90 дней',
    getValue: () => {
      const to = new Date();
      const from = new Date(to);
      from.setDate(from.getDate() - 90);
      return { from, to };
    },
  },
  {
    label: 'Этот месяц',
    getValue: () => {
      const today = new Date();
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from, to: today };
    },
  },
  {
    label: 'Последний месяц',
    getValue: () => {
      const today = new Date();
      const to = new Date(today.getFullYear(), today.getMonth(), 0);
      const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      return { from, to };
    },
  },
];

function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function getFirstDayOfMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function DateRangePicker({
  value,
  onChange,
  presets = defaultPresets,
  disabled = false,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedRange, setSelectedRange] = useState<DateRange | null>(value || null);
  const [isSelectingEnd, setIsSelectingEnd] = useState(false);

  const handleDateClick = (day: number) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);

    if (!selectedRange || isSelectingEnd) {
      const newRange = {
        from: selectedRange?.from || selectedDate,
        to: selectedDate,
      };

      if (newRange.from > newRange.to) {
        [newRange.from, newRange.to] = [newRange.to, newRange.from];
      }

      setSelectedRange(newRange);
      onChange?.(newRange);
      setIsSelectingEnd(false);
      setIsOpen(false);
    } else {
      setSelectedRange({ from: selectedDate, to: selectedDate });
      setIsSelectingEnd(true);
    }
  };

  const handlePreset = (preset: (typeof presets)[0]) => {
    const range = preset.getValue();
    setSelectedRange(range);
    onChange?.(range);
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const monthName = currentMonth.toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric',
  });

  const isDateInRange = (day: number): boolean => {
    if (!selectedRange) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date >= selectedRange.from && date <= selectedRange.to;
  };

  const isDateStart = (day: number): boolean => {
    if (!selectedRange) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date.toDateString() === selectedRange.from.toDateString();
  };

  const isDateEnd = (day: number): boolean => {
    if (!selectedRange) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date.toDateString() === selectedRange.to.toDateString();
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full justify-start text-left font-normal"
      >
        <Calendar className="mr-2 h-4 w-4" />
        {selectedRange
          ? `${formatDate(selectedRange.from)} - ${formatDate(selectedRange.to)}`
          : 'Выберите период'}
      </Button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-96 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
          <div className="grid grid-cols-2 gap-4">
            {/* Calendar */}
            <div className="col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{monthName}</h3>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrevMonth}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNextMonth}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Weekdays */}
              <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500">
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
                  <div key={day}>{day}</div>
                ))}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7 gap-1">
                {emptyDays.map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {days.map((day) => {
                  const inRange = isDateInRange(day);
                  const isStart = isDateStart(day);
                  const isEnd = isDateEnd(day);

                  return (
                    <button
                      key={day}
                      onClick={() => handleDateClick(day)}
                      className={cn(
                        'relative h-8 w-8 rounded text-sm font-medium transition-colors',
                        inRange && !isStart && !isEnd && 'bg-blue-50 text-gray-900',
                        (isStart || isEnd) && 'bg-blue-600 text-white',
                        !inRange && 'hover:bg-gray-100 text-gray-700'
                      )}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Presets */}
            <div className="col-span-2 border-t border-gray-200 pt-4">
              <p className="mb-2 text-xs font-semibold text-gray-600">Быстрые фильтры</p>
              <div className="grid grid-cols-2 gap-2">
                {presets.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreset(preset)}
                    className="text-xs"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Selected range display */}
            {selectedRange && (
              <div className="col-span-2 border-t border-gray-200 pt-4">
                <p className="text-xs text-gray-600">
                  <span className="font-semibold">Выбранный период:</span>
                  <br />
                  {formatDate(selectedRange.from)} - {formatDate(selectedRange.to)}
                </p>
              </div>
            )}

            {/* Close button */}
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="col-span-2"
            >
              Применить
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
