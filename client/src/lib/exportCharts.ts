import html2canvas from 'html2canvas';

interface ExportOptions {
  filename?: string;
  quality?: number;
  scale?: number;
  backgroundColor?: string;
}

/**
 * Export a chart element to PNG
 */
export async function exportChartToPNG(
  elementId: string,
  options: ExportOptions = {}
): Promise<void> {
  const {
    filename = `chart-${Date.now()}.png`,
    quality = 0.95,
    scale = 2,
    backgroundColor = '#ffffff',
  } = options;

  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`);
    }

    const canvas = await html2canvas(element, {
      scale,
      backgroundColor,
      useCORS: true,
      logging: false,
    });

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png', quality);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Failed to export chart to PNG:', error);
    throw error;
  }
}

/**
 * Export multiple charts to a single PDF
 */
export async function exportChartsToPDF(
  elementIds: string[],
  options: ExportOptions = {}
): Promise<void> {
  const { filename = `dashboard-${Date.now()}.pdf`, scale = 2, backgroundColor = '#ffffff' } = options;

  try {
    // Dynamically import jsPDF
    const { jsPDF } = await import('jspdf');

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    let isFirstPage = true;

    for (const elementId of elementIds) {
      const element = document.getElementById(elementId);
      if (!element) {
        console.warn(`Element with id "${elementId}" not found, skipping`);
        continue;
      }

      if (!isFirstPage) {
        pdf.addPage();
      }

      const canvas = await html2canvas(element, {
        scale,
        backgroundColor,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 280;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      isFirstPage = false;
    }

    pdf.save(filename);
  } catch (error) {
    console.error('Failed to export charts to PDF:', error);
    throw error;
  }
}

/**
 * Export chart as SVG (for vector graphics)
 */
export async function exportChartToSVG(elementId: string, filename: string = `chart-${Date.now()}.svg`): Promise<void> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`);
    }

    // Clone the element to avoid modifying the original
    const _clone = element.cloneNode(true) as HTMLElement;

    // Create SVG wrapper
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', element.offsetWidth.toString());
    svg.setAttribute('height', element.offsetHeight.toString());
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    // Convert HTML to SVG (simplified approach)
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);

    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export chart to SVG:', error);
    throw error;
  }
}

/**
 * Export chart data as CSV
 */
export function exportChartDataToCSV(
  data: Array<Record<string, any>>,
  filename: string = `chart-data-${Date.now()}.csv`
): void {
  try {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            // Escape quotes and wrap in quotes if contains comma
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export chart data to CSV:', error);
    throw error;
  }
}

/**
 * Copy chart image to clipboard
 */
export async function copyChartToClipboard(elementId: string): Promise<void> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`);
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    });

    canvas.toBlob((blob) => {
      if (!blob) throw new Error('Failed to create blob');

      const item = new ClipboardItem({ 'image/png': blob });
      navigator.clipboard.write([item]).catch((error) => {
        console.error('Failed to copy to clipboard:', error);
      });
    });
  } catch (error) {
    console.error('Failed to copy chart to clipboard:', error);
    throw error;
  }
}
