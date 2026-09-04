import { useRef, useState } from 'react';
import { Download, Upload, Loader2, FileSpreadsheet } from 'lucide-react';
import { saveBlob } from '@/lib/api.js';

export default function SpreadsheetActions({ onExport, onImport, exportName = 'portal-export.xlsx', label = 'Excel' }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState('');

  const handleExport = async () => {
    setBusy('export');
    try {
      const blob = await onExport();
      saveBlob(blob, exportName);
    } catch (error) {
      window.alert(error.message || 'Unable to export spreadsheet');
    } finally {
      setBusy('');
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      window.alert('Please choose an Excel file with .xlsx or .xls extension.');
      return;
    }
    setBusy('import');
    try {
      const response = await onImport(file);
      const data = response?.data || {};
      const summary = [
        data.created !== undefined ? `Created: ${data.created}` : '',
        data.updated !== undefined ? `Updated: ${data.updated}` : '',
        data.skipped !== undefined ? `Skipped: ${data.skipped}` : '',
      ].filter(Boolean).join(' · ');
      const errors = Array.isArray(data.errors) && data.errors.length ? `\n\n${data.errors.join('\n')}` : '';
      window.alert(summary ? `Import complete — ${summary}${errors}` : `Import complete.${errors}`);
    } catch (error) {
      window.alert([error.message, ...(error.details || [])].filter(Boolean).join('\n'));
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="spreadsheet-actions">
      <button type="button" className="spreadsheet-button spreadsheet-button--ghost" onClick={handleExport} disabled={!!busy} title={`Export ${label}`}>
        {busy === 'export' ? <Loader2 size={15} className="spin" /> : <Download size={15} />}
        <span>Export</span>
      </button>
      <button type="button" className="spreadsheet-button spreadsheet-button--accent" onClick={() => inputRef.current?.click()} disabled={!!busy} title={`Import ${label}`}>
        {busy === 'import' ? <Loader2 size={15} className="spin" /> : <Upload size={15} />}
        <span>Import</span>
      </button>
      <input ref={inputRef} type="file" accept=".xlsx,.xls" onChange={handleImport} hidden />
      <FileSpreadsheet size={14} className="spreadsheet-mark" aria-hidden="true" />
    </div>
  );
}
