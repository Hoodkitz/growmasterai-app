/**
 * Export & Backup Service
 * Export grow data to PDF, CSV, or backup
 */

// SDK 54: string read/write APIs live in the legacy entry point
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { Platform } from 'react-native';
import { format } from 'date-fns';
import type { Expense } from './cost-tracking';
import { buildExpensesCsv, csvCell, escapeHtml, generateExpensesHTML } from './export-format';

export interface PlantData {
  id: string;
  name: string;
  strain?: string;
  growthStage: string;
  startDate: Date;
  journalEntries: JournalEntry[];
  diagnoses: any[];
  expenses: any[];
}

export interface JournalEntry {
  id: string;
  date: Date;
  notes?: string;
  photos: string[];
  height?: number;
  ph?: number;
  temperature?: number;
  humidity?: number;
}

function safeFileName(name: string): string {
  return name.replace(/[^\w\-]+/g, '_').replace(/^_+|_+$/g, '') || 'plant';
}

function writableDir(): string {
  const dir = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
  if (!dir) throw new Error('Kein beschreibbares Verzeichnis verfügbar');
  return dir;
}

/**
 * Export plant data to CSV
 */
export async function exportToCSV(plantData: PlantData): Promise<string> {
  const headers = ['Date', 'Notes', 'Height (cm)', 'pH', 'Temp (°C)', 'Humidity (%)', 'Photos'];
  const rows = plantData.journalEntries.map(entry => [
    format(entry.date, 'yyyy-MM-dd'),
    entry.notes || '',
    entry.height ?? '',
    entry.ph ?? '',
    entry.temperature ?? '',
    entry.humidity ?? '',
    entry.photos.length,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(csvCell).join(',')),
  ].join('\n');

  const fileName = `${safeFileName(plantData.name)}_journal_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  const filePath = `${writableDir()}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, csvContent);
  return filePath;
}

/**
 * Generate HTML report for PDF conversion
 */
export function generateHTMLReport(plantData: PlantData): string {
  const totalDays = Math.max(
    0,
    Math.floor((Date.now() - new Date(plantData.startDate).getTime()) / 86400000) + 1
  );
  const totalPhotos = plantData.journalEntries.reduce((sum, e) => sum + e.photos.length, 0);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${escapeHtml(plantData.name)} - Grow Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 40px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          border-bottom: 3px solid #10B981;
          padding-bottom: 20px;
        }
        h1 { color: #10B981; }
        .summary {
          background: #f0f9ff;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .summary-item {
          display: inline-block;
          width: 45%;
          margin: 10px 2%;
        }
        .entry {
          border-left: 4px solid #10B981;
          padding-left: 20px;
          margin-bottom: 30px;
        }
        .entry-date {
          font-weight: bold;
          color: #10B981;
          font-size: 18px;
        }
        .entry-notes {
          margin: 10px 0;
        }
        .metrics {
          background: #f9f9f9;
          padding: 10px;
          border-radius: 4px;
          margin: 10px 0;
        }
        .footer {
          text-align: center;
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🌱 ${escapeHtml(plantData.name)}</h1>
        <p>Grow Report - Generated ${format(new Date(), 'MMMM d, yyyy')}</p>
      </div>

      <div class="summary">
        <h2>Grow Summary</h2>
        <div class="summary-item">
          <strong>Strain:</strong> ${escapeHtml(plantData.strain || 'Unknown')}
        </div>
        <div class="summary-item">
          <strong>Growth Stage:</strong> ${escapeHtml(plantData.growthStage)}
        </div>
        <div class="summary-item">
          <strong>Start Date:</strong> ${format(plantData.startDate, 'MMM d, yyyy')}
        </div>
        <div class="summary-item">
          <strong>Total Days:</strong> ${totalDays}
        </div>
        <div class="summary-item">
          <strong>Journal Entries:</strong> ${plantData.journalEntries.length}
        </div>
        <div class="summary-item">
          <strong>Photos Taken:</strong> ${totalPhotos}
        </div>
      </div>

      <h2>Journal Entries</h2>
      ${plantData.journalEntries.map(entry => `
        <div class="entry">
          <div class="entry-date">${format(entry.date, 'EEEE, MMMM d, yyyy')}</div>
          ${entry.notes ? `<div class="entry-notes">${escapeHtml(entry.notes)}</div>` : ''}
          ${entry.height || entry.ph || entry.temperature || entry.humidity ? `
            <div class="metrics">
              ${entry.height ? `<strong>Height:</strong> ${entry.height}cm &nbsp;` : ''}
              ${entry.ph ? `<strong>pH:</strong> ${entry.ph} &nbsp;` : ''}
              ${entry.temperature ? `<strong>Temp:</strong> ${entry.temperature}°C &nbsp;` : ''}
              ${entry.humidity ? `<strong>Humidity:</strong> ${entry.humidity}% &nbsp;` : ''}
            </div>
          ` : ''}
          ${entry.photos.length > 0 ? `<p>📸 ${entry.photos.length} photo(s)</p>` : ''}
        </div>
      `).join('')}

      <div class="footer">
        <p>Generated by GrowMaster AI</p>
        <p>www.growmaster.ai</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Render an HTML string to a real PDF file in the document directory.
 * Returns the file URI, or '' on web (where the browser print dialog is opened instead).
 */
async function htmlToPdfFile(html: string, baseName: string): Promise<string> {
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return '';
  }
  const { uri } = await Print.printToFileAsync({ html });
  const target = `${writableDir()}${safeFileName(baseName)}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  try {
    await FileSystem.deleteAsync(target, { idempotent: true });
    await FileSystem.moveAsync({ from: uri, to: target });
    return target;
  } catch {
    // moving failed (e.g. cache->documents); the generated PDF at `uri` is still valid
    return uri;
  }
}

/**
 * Export the grow report as a real PDF (expo-print).
 */
export async function exportToPDF(plantData: PlantData): Promise<string> {
  return htmlToPdfFile(generateHTMLReport(plantData), `${plantData.name}_report`);
}

/**
 * Export expenses as CSV file.
 */
export async function exportExpensesToCSV(expenses: Expense[], name = 'expenses'): Promise<string> {
  const filePath = `${writableDir()}${safeFileName(name)}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  await FileSystem.writeAsStringAsync(filePath, buildExpensesCsv(expenses));
  return filePath;
}

/**
 * Export expenses as PDF file.
 */
export async function exportExpensesToPDF(expenses: Expense[], name = 'expenses'): Promise<string> {
  return htmlToPdfFile(generateExpensesHTML(expenses, 'Expense Report'), name);
}

/**
 * Share exported file
 */
export async function shareFile(filePath: string): Promise<void> {
  const canShare = await Sharing.isAvailableAsync();

  if (canShare) {
    await Sharing.shareAsync(filePath);
  } else {
    throw new Error('Teilen wird auf diesem Gerät nicht unterstützt');
  }
}

/**
 * Create full backup of all user data
 */
export async function createBackup(userData: any): Promise<string> {
  const backup = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    data: userData,
  };

  const fileName = `growmaster_backup_${format(new Date(), 'yyyy-MM-dd')}.json`;
  const filePath = `${writableDir()}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, JSON.stringify(backup, null, 2));
  return filePath;
}

/**
 * Restore from backup
 */
export async function restoreBackup(filePath: string): Promise<any> {
  const content = await FileSystem.readAsStringAsync(filePath);
  const backup = JSON.parse(content);

  if (!backup || typeof backup !== 'object' || !('data' in backup)) {
    throw new Error('Invalid backup file');
  }
  if (backup.version !== '1.0.0') {
    throw new Error('Incompatible backup version');
  }

  return backup.data;
}
