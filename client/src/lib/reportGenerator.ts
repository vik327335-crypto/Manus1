/**
 * Report Generator Utility
 * Generates PDF reports with AI analysis for trading strategies
 */

export interface ReportData {
  strategyName: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  metrics: {
    roi: number;
    winRate: number;
    sharpeRatio: number;
    profitFactor: number;
    maxDrawdown: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
  };
  aiAnalysis: {
    summary: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    riskAssessment: 'low' | 'medium' | 'high';
  };
  alerts: Array<{
    type: 'critical' | 'warning' | 'info';
    message: string;
    timestamp: Date;
  }>;
}

export class ReportGenerator {
  /**
   * Generate HTML content for the report
   */
  static generateHTML(data: ReportData): string {
    const formatDate = (date: Date) => date.toLocaleDateString('ru-RU');
    const formatPercent = (value: number) => `${value.toFixed(2)}%`;
    const formatNumber = (value: number) => value.toFixed(2);

    return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Отчёт о стратегии ${data.strategyName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f5f5f5;
      color: #333;
      line-height: 1.6;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background-color: white;
      padding: 40px;
    }
    .header {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #1e40af;
      font-size: 28px;
      margin-bottom: 10px;
    }
    .header p {
      color: #666;
      font-size: 14px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section h2 {
      color: #1e40af;
      font-size: 20px;
      margin-bottom: 15px;
      border-left: 4px solid #2563eb;
      padding-left: 10px;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }
    .metric-card {
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 15px;
      text-align: center;
    }
    .metric-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .metric-value {
      font-size: 24px;
      font-weight: bold;
      color: #1e40af;
    }
    .metric-value.positive {
      color: #059669;
    }
    .metric-value.negative {
      color: #dc2626;
    }
    .list {
      list-style: none;
      padding: 0;
    }
    .list li {
      padding: 8px 0;
      padding-left: 25px;
      position: relative;
      font-size: 14px;
    }
    .list li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #059669;
      font-weight: bold;
    }
    .list.warnings li:before {
      content: "⚠";
      color: #f59e0b;
    }
    .list.recommendations li:before {
      content: "→";
      color: #2563eb;
    }
    .alert {
      padding: 12px 15px;
      border-radius: 6px;
      margin-bottom: 10px;
      font-size: 13px;
      border-left: 4px solid;
    }
    .alert.critical {
      background-color: #fee2e2;
      border-left-color: #dc2626;
      color: #991b1b;
    }
    .alert.warning {
      background-color: #fef3c7;
      border-left-color: #f59e0b;
      color: #92400e;
    }
    .alert.info {
      background-color: #dbeafe;
      border-left-color: #2563eb;
      color: #1e40af;
    }
    .risk-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .risk-badge.low {
      background-color: #d1fae5;
      color: #065f46;
    }
    .risk-badge.medium {
      background-color: #fef3c7;
      color: #92400e;
    }
    .risk-badge.high {
      background-color: #fee2e2;
      color: #991b1b;
    }
    .footer {
      border-top: 1px solid #e5e7eb;
      padding-top: 20px;
      margin-top: 30px;
      font-size: 12px;
      color: #999;
      text-align: center;
    }
    @media print {
      body {
        background-color: white;
      }
      .container {
        max-width: 100%;
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>Отчёт о стратегии</h1>
      <p><strong>${data.strategyName}</strong></p>
      <p>Период: ${formatDate(data.period.startDate)} - ${formatDate(data.period.endDate)}</p>
      <p>Дата создания: ${formatDate(new Date())}</p>
    </div>

    <!-- Metrics Section -->
    <div class="section">
      <h2>Ключевые метрики</h2>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">ROI</div>
          <div class="metric-value ${data.metrics.roi >= 0 ? 'positive' : 'negative'}">
            ${formatPercent(data.metrics.roi)}
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Win Rate</div>
          <div class="metric-value ${data.metrics.winRate >= 50 ? 'positive' : 'negative'}">
            ${formatPercent(data.metrics.winRate)}
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Sharpe Ratio</div>
          <div class="metric-value ${data.metrics.sharpeRatio >= 1 ? 'positive' : 'negative'}">
            ${formatNumber(data.metrics.sharpeRatio)}
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Profit Factor</div>
          <div class="metric-value ${data.metrics.profitFactor >= 1.5 ? 'positive' : 'negative'}">
            ${formatNumber(data.metrics.profitFactor)}
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Max Drawdown</div>
          <div class="metric-value negative">
            ${formatPercent(data.metrics.maxDrawdown)}
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Всего сделок</div>
          <div class="metric-value">
            ${data.metrics.totalTrades}
          </div>
        </div>
      </div>
    </div>

    <!-- Trade Statistics -->
    <div class="section">
      <h2>Статистика сделок</h2>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">Выигрышные сделки</div>
          <div class="metric-value positive">
            ${data.metrics.winningTrades}
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Проигрышные сделки</div>
          <div class="metric-value negative">
            ${data.metrics.losingTrades}
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Коэффициент выигрыша</div>
          <div class="metric-value">
            ${data.metrics.winningTrades > 0 ? (data.metrics.winningTrades / data.metrics.totalTrades).toFixed(2) : '0.00'}
          </div>
        </div>
      </div>
    </div>

    <!-- AI Analysis -->
    <div class="section">
      <h2>AI Анализ</h2>
      
      <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <p><strong>Резюме:</strong></p>
        <p style="margin-top: 10px; color: #333;">${data.aiAnalysis.summary}</p>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="color: #1e40af; font-size: 16px; margin-bottom: 10px;">Сильные стороны</h3>
        <ul class="list">
          ${data.aiAnalysis.strengths.map((s) => `<li>${s}</li>`).join('')}
        </ul>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="color: #1e40af; font-size: 16px; margin-bottom: 10px;">Слабые стороны</h3>
        <ul class="list warnings">
          ${data.aiAnalysis.weaknesses.map((w) => `<li>${w}</li>`).join('')}
        </ul>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="color: #1e40af; font-size: 16px; margin-bottom: 10px;">Рекомендации</h3>
        <ul class="list recommendations">
          ${data.aiAnalysis.recommendations.map((r) => `<li>${r}</li>`).join('')}
        </ul>
      </div>

      <div>
        <p style="margin-bottom: 10px;"><strong>Оценка риска:</strong></p>
        <span class="risk-badge ${data.aiAnalysis.riskAssessment}">
          ${data.aiAnalysis.riskAssessment === 'low' ? 'Низкий' : data.aiAnalysis.riskAssessment === 'medium' ? 'Средний' : 'Высокий'}
        </span>
      </div>
    </div>

    <!-- Alerts -->
    ${data.alerts.length > 0 ? `
      <div class="section">
        <h2>Критические алерты</h2>
        ${data.alerts.map((alert) => `
          <div class="alert ${alert.type}">
            <strong>${alert.type === 'critical' ? 'КРИТИЧНО' : alert.type === 'warning' ? 'ПРЕДУПРЕЖДЕНИЕ' : 'ИНФОРМАЦИЯ'}:</strong>
            ${alert.message}
          </div>
        `).join('')}
      </div>
    ` : ''}

    <!-- Footer -->
    <div class="footer">
      <p>Этот отчёт был автоматически сгенерирован системой CAN SLIM Crypto Scanner</p>
      <p>© 2026 CAN SLIM Crypto Scanner. Все права защищены.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Download report as HTML file
   */
  static downloadHTML(data: ReportData): void {
    const html = this.generateHTML(data);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Report_${data.strategyName}_${new Date().toISOString().split('T')[0]}.html`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  /**
   * Download report as CSV (metrics only)
   */
  static downloadCSV(data: ReportData): void {
    const rows = [
      ['CAN SLIM Crypto Scanner - Отчёт о стратегии'],
      ['Стратегия', data.strategyName],
      ['Период', `${data.period.startDate.toLocaleDateString('ru-RU')} - ${data.period.endDate.toLocaleDateString('ru-RU')}`],
      ['Дата создания', new Date().toLocaleDateString('ru-RU')],
      [],
      ['Метрика', 'Значение'],
      ['ROI', `${data.metrics.roi}%`],
      ['Win Rate', `${data.metrics.winRate}%`],
      ['Sharpe Ratio', data.metrics.sharpeRatio],
      ['Profit Factor', data.metrics.profitFactor],
      ['Max Drawdown', `${data.metrics.maxDrawdown}%`],
      ['Всего сделок', data.metrics.totalTrades],
      ['Выигрышные сделки', data.metrics.winningTrades],
      ['Проигрышные сделки', data.metrics.losingTrades],
    ];

    const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Report_${data.strategyName}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  /**
   * Download report as JSON
   */
  static downloadJSON(data: ReportData): void {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Report_${data.strategyName}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }
}
