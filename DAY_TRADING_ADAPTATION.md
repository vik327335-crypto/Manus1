# Day Trading Adaptation для CAN SLIM Crypto Scanner

## Обзор

Адаптация платформы CAN SLIM Crypto Scanner для внутридневного трейдинга (day trading) с поддержкой краткосрочных стратегий, микро-уровневого анализа и высокочастотного мониторинга.

---

## 1. Требования для Day Trading

### 1.1 Временные фреймы
- **1-минутные свечи (1m)** - для скальпинга и микро-уровневого анализа
- **5-минутные свечи (5m)** - для краткосрочных сигналов
- **15-минутные свечи (15m)** - для подтверждения тренда
- **30-минутные свечи (30m)** - для более широкого контекста

### 1.2 Стратегии день-трейдинга
1. **Scalping** - Покупка и продажа за несколько минут для получения малых прибылей
2. **Momentum Trading** - Следование за быстрыми движениями цены
3. **Breakout Trading** - Торговля при прорыве уровней поддержки/сопротивления
4. **Range Trading** - Торговля в боковом диапазоне между уровнями
5. **News Trading** - Торговля на основе новостей и событий

### 1.3 Ключевые показатели
- **Волатильность** - Для определения потенциальных движений
- **Объём** - Для подтверждения сигналов
- **Скорость изменения цены** - Для определения импульса
- **Ликвидность** - Для быстрого входа/выхода

---

## 2. Индикаторы для Day Trading

### 2.1 Основные индикаторы

#### RSI (Relative Strength Index)
```
Формула: RSI = 100 - (100 / (1 + RS))
где RS = средний прирост / средний убыток (за период 14)

Интерпретация для day trading:
- RSI > 70: перекупленность (сигнал продажи)
- RSI < 30: перепроданность (сигнал покупки)
- Дивергенция: расхождение между ценой и RSI (разворот)
```

#### MACD (Moving Average Convergence Divergence)
```
Формула:
- MACD Line = EMA(12) - EMA(26)
- Signal Line = EMA(9) MACD
- Histogram = MACD - Signal

Интерпретация для day trading:
- MACD пересекает Signal выше: сигнал покупки
- MACD пересекает Signal ниже: сигнал продажи
- Гистограмма растёт: усиление тренда
```

#### Bollinger Bands
```
Формула:
- Middle Band = SMA(20)
- Upper Band = Middle + (2 * StdDev)
- Lower Band = Middle - (2 * StdDev)

Интерпретация для day trading:
- Цена касается Upper Band: сигнал продажи
- Цена касается Lower Band: сигнал покупки
- Сжатие полос: низкая волатильность (готовность к движению)
- Расширение полос: высокая волатильность (тренд)
```

#### Volume Profile
```
Анализ распределения объёма по ценовым уровням

Интерпретация для day trading:
- Высокий объём на уровне: поддержка/сопротивление
- Низкий объём: быстрое прохождение цены
- Point of Control (POC): уровень с максимальным объёмом
```

### 2.2 Система сигналов

#### Сигнал покупки (BUY)
```
Условия:
1. RSI < 30 (перепроданность)
2. MACD пересекает Signal выше
3. Цена выше SMA(20)
4. Объём выше среднего
5. Нет отрицательных новостей
```

#### Сигнал продажи (SELL)
```
Условия:
1. RSI > 70 (перекупленность)
2. MACD пересекает Signal ниже
3. Цена ниже SMA(20)
4. Объём выше среднего
5. Нет положительных новостей
```

---

## 3. Архитектура для высокочастотных данных

### 3.1 Структура данных

```typescript
// Tick-данные
interface Tick {
  timestamp: number;
  price: number;
  volume: number;
  bid: number;
  ask: number;
  bidVolume: number;
  askVolume: number;
}

// OHLCV свечи
interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeframe: '1m' | '5m' | '15m' | '30m';
}

// Индикаторы
interface Indicators {
  rsi: number;
  macd: {
    line: number;
    signal: number;
    histogram: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
  volumeProfile: {
    poc: number;
    highVolumeLevels: number[];
  };
}
```

### 3.2 Обработка данных

```
Поток данных:
1. Получение tick-данных через WebSocket
2. Агрегация в OHLCV свечи (1m, 5m, 15m, 30m)
3. Расчёт индикаторов для каждого фрейма
4. Генерация сигналов на основе индикаторов
5. Отправка сигналов пользователю через WebSocket
6. Сохранение данных в БД для анализа
```

### 3.3 Кэширование

```
Кэш-стратегия:
- Последние 100 свечей (1m): в памяти
- Последние 50 свечей (5m): в памяти
- Индикаторы: пересчитываются при новой свече
- Исторические данные: в БД с индексированием
```

---

## 4. Управление риском

### 4.1 Стоп-лосс

```typescript
interface StopLoss {
  type: 'fixed' | 'percentage' | 'trailing';
  value: number; // Абсолютное значение или процент
  triggerPrice: number; // Цена срабатывания
}

// Примеры:
// Fixed: стоп-лосс на 100 пунктов ниже входа
// Percentage: стоп-лосс на 2% ниже входа
// Trailing: стоп-лосс следует за ценой на 50 пунктов
```

### 4.2 Take-Profit

```typescript
interface TakeProfit {
  levels: Array<{
    price: number;
    percentageToClose: number; // % позиции для закрытия
  }>;
}

// Пример:
// Level 1: +100 пунктов - закрыть 50% позиции
// Level 2: +200 пунктов - закрыть 30% позиции
// Level 3: +300 пунктов - закрыть 20% позиции
```

### 4.3 Калькулятор риска/прибыли

```typescript
interface RiskRewardRatio {
  entry: number;
  stopLoss: number;
  takeProfit: number;
  
  // Вычисляемые значения:
  riskAmount: number; // entry - stopLoss
  rewardAmount: number; // takeProfit - entry
  ratio: number; // rewardAmount / riskAmount
  
  // Рекомендация: ratio должен быть >= 1.5
}
```

### 4.4 Управление размером позиции

```typescript
interface PositionSize {
  accountBalance: number;
  riskPercentage: number; // % от баланса (обычно 1-2%)
  riskAmount: number; // accountBalance * riskPercentage
  
  // Размер позиции вычисляется:
  // positionSize = riskAmount / (entry - stopLoss)
}
```

---

## 5. Оптимизация производительности

### 5.1 Обработка tick-данных

```
Оптимизация:
- Батчинг: обработка 100 tick-ов за раз
- Параллельная обработка: несколько активов одновременно
- Асинхронная обработка: не блокировать UI
- Индексирование: быстрый поиск по цене/времени
```

### 5.2 Кэширование индикаторов

```
Стратегия:
- Кэш последних 100 значений каждого индикатора
- Инвалидация при новой свече
- Предварительный расчёт для популярных фреймов
- LRU (Least Recently Used) для управления памятью
```

### 5.3 WebSocket оптимизация

```
Оптимизация:
- Компрессия данных (gzip)
- Отправка только изменённых данных (delta updates)
- Throttling: ограничение частоты обновлений
- Backpressure: управление буфером отправки
```

---

## 6. База данных

### 6.1 Новые таблицы

```sql
-- Tick-данные
CREATE TABLE ticks (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  asset_id INT NOT NULL,
  timestamp BIGINT NOT NULL,
  price DECIMAL(20, 8) NOT NULL,
  volume DECIMAL(20, 8) NOT NULL,
  bid DECIMAL(20, 8),
  ask DECIMAL(20, 8),
  INDEX (asset_id, timestamp)
);

-- OHLCV свечи
CREATE TABLE candles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  asset_id INT NOT NULL,
  timeframe VARCHAR(10) NOT NULL,
  timestamp BIGINT NOT NULL,
  open DECIMAL(20, 8) NOT NULL,
  high DECIMAL(20, 8) NOT NULL,
  low DECIMAL(20, 8) NOT NULL,
  close DECIMAL(20, 8) NOT NULL,
  volume DECIMAL(20, 8) NOT NULL,
  UNIQUE (asset_id, timeframe, timestamp),
  INDEX (asset_id, timeframe, timestamp)
);

-- Индикаторы
CREATE TABLE indicators (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  asset_id INT NOT NULL,
  timeframe VARCHAR(10) NOT NULL,
  timestamp BIGINT NOT NULL,
  rsi DECIMAL(10, 2),
  macd_line DECIMAL(20, 8),
  macd_signal DECIMAL(20, 8),
  macd_histogram DECIMAL(20, 8),
  bb_upper DECIMAL(20, 8),
  bb_middle DECIMAL(20, 8),
  bb_lower DECIMAL(20, 8),
  UNIQUE (asset_id, timeframe, timestamp),
  INDEX (asset_id, timeframe, timestamp)
);

-- Сигналы
CREATE TABLE day_trading_signals (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  asset_id INT NOT NULL,
  user_id INT NOT NULL,
  timestamp BIGINT NOT NULL,
  signal_type VARCHAR(10) NOT NULL, -- 'BUY' или 'SELL'
  price DECIMAL(20, 8) NOT NULL,
  confidence DECIMAL(5, 2) NOT NULL, -- 0-100
  indicators JSON NOT NULL,
  INDEX (asset_id, user_id, timestamp)
);

-- Позиции day trading
CREATE TABLE day_trading_positions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  asset_id INT NOT NULL,
  entry_price DECIMAL(20, 8) NOT NULL,
  quantity DECIMAL(20, 8) NOT NULL,
  stop_loss DECIMAL(20, 8) NOT NULL,
  take_profit DECIMAL(20, 8) NOT NULL,
  entry_time BIGINT NOT NULL,
  exit_time BIGINT,
  exit_price DECIMAL(20, 8),
  pnl DECIMAL(20, 8),
  pnl_percentage DECIMAL(10, 2),
  status VARCHAR(20) NOT NULL, -- 'OPEN', 'CLOSED', 'STOPPED'
  INDEX (user_id, asset_id, entry_time)
);
```

---

## 7. Фронтенд компоненты

### 7.1 Day Trading Dashboard

```
Компоненты:
- Live price ticker (обновление каждую секунду)
- Микро-уровневые графики (1m, 5m, 15m, 30m)
- Индикаторы в реальном времени
- Сигналы покупки/продажи
- Список открытых позиций
- История сделок
- Калькулятор риска/прибыли
```

### 7.2 Инструменты рисования

```
Функции:
- Трендовые линии
- Уровни поддержки/сопротивления
- Горизонтальные линии
- Текстовые аннотации
- Сохранение рисунков
```

### 7.3 Горячие клавиши

```
Клавиши:
- B: быстрая покупка
- S: быстрая продажа
- Esc: отмена
- Space: пауза/возобновление
- +/-: увеличение/уменьшение размера позиции
- L: открыть лимит-ордер
- M: открыть рыночный ордер
```

---

## 8. Тестирование

### 8.1 Unit тесты

```
Тестирование:
- Расчёт индикаторов
- Генерация сигналов
- Управление позициями
- Калькулятор риска/прибыли
```

### 8.2 Интеграционные тесты

```
Тестирование:
- Получение tick-данных
- Агрегация в свечи
- Сохранение в БД
- Отправка сигналов
```

### 8.3 Backtesting

```
Тестирование:
- Исторические данные за 1-5 лет
- Симуляция стратегий day trading
- Расчёт метрик (win rate, ROI, Sharpe ratio)
- Оптимизация параметров
```

---

## 9. Развёртывание

### 9.1 Требования к серверу

```
Характеристики:
- CPU: 8+ ядер
- RAM: 16+ GB
- Хранилище: 500+ GB SSD
- Сетевое соединение: 1+ Gbps
- Задержка: < 100ms до биржи
```

### 9.2 Конфигурация

```
Переменные окружения:
- DAY_TRADING_ENABLED=true
- TICK_DATA_BUFFER_SIZE=10000
- CANDLE_CACHE_SIZE=100
- INDICATOR_CACHE_SIZE=1000
- WEBSOCKET_BATCH_SIZE=100
- WEBSOCKET_THROTTLE_MS=100
```

---

## 10. Мониторинг и логирование

### 10.1 Метрики

```
Отслеживание:
- Количество tick-ов в секунду
- Задержка обработки данных
- Количество сигналов в день
- Win rate стратегий
- Среднее время удержания позиции
- Максимальная просадка
```

### 10.2 Логирование

```
Логи:
- Все входы и выходы из позиций
- Все сигналы (даже не исполненные)
- Ошибки обработки данных
- Проблемы с WebSocket соединением
- Проблемы с БД
```

---

## Заключение

Адаптация CAN SLIM Crypto Scanner для day trading обеспечит трейдерам профессиональные инструменты для краткосрочной торговли с управлением риском и оптимизированной производительностью.

**Сроки реализации:** 6-8 недель (Phase 76-81)
**Приоритет:** Высокий (требуется для конкурентоспособности)
