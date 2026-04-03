import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFExportOptions {
  title: string;
  ticker: string;
  period: string;
  includeCharts: boolean;
  includeMetrics: boolean;
  includeComparison?: boolean;
}

/**
 * Export Price Action Analysis to PDF
 */
export async function exportPriceActionPDF(
  elementId: string,
  options: PDFExportOptions
): Promise<void> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found for PDF export');
    }

    // Create canvas from HTML element
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF('p', 'mm', 'a4');
    let heightLeft = imgHeight;
    let position = 0;

    // Add title page
    pdf.setFontSize(24);
    pdf.text(options.title, 20, 20);
    pdf.setFontSize(12);
    pdf.text(`Ticker: ${options.ticker}`, 20, 30);
    pdf.text(`Period: ${options.period}`, 20, 40);
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 50);

    // Add content pages
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Save PDF
    pdf.save(`${options.ticker}-${options.period}-analysis.pdf`);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    throw new Error('Failed to export PDF');
  }
}

/**
 * Export comparison analysis to PDF
 */
export async function exportComparisonPDF(
  elementId: string,
  ticker: string,
  periods: string[]
): Promise<void> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found for PDF export');
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF('p', 'mm', 'a4');
    let heightLeft = imgHeight;
    let position = 0;

    // Add title page
    pdf.setFontSize(24);
    pdf.text('Period Comparison Analysis', 20, 20);
    pdf.setFontSize(12);
    pdf.text(`Ticker: ${ticker}`, 20, 30);
    pdf.text(`Periods: ${periods.join(', ')}`, 20, 40);
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 50);

    // Add content pages
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Save PDF
    pdf.save(`${ticker}-comparison-${new Date().getTime()}.pdf`);
  } catch (error) {
    console.error('Error exporting comparison PDF:', error);
    throw new Error('Failed to export comparison PDF');
  }
}

/**
 * Export as CSV for spreadsheet analysis
 */
export function exportAsCSV(
  data: Record<string, any>[],
  filename: string
): void {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((header) => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    ),
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export analysis data as JSON
 */
export function exportAsJSON(data: any, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
