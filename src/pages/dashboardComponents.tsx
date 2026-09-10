// Small presentational components extracted from Dashboard.tsx.
import React, { useEffect, useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { ensureExcelFileSize, ensureExcelRowLimit } from '../utils/safeExcel';
import { readFirstSheetAsJsonFast } from '../utils/excelWorkerClient';
import { ensureBwip, lazyLibs } from './dashboardLazyLibs';
import { restoreDataMatrixGs } from '../utils/honestSign';

export const ExcelUploader = ({ onUpload, disabled = false, maxFileBytes, onBatchStart, onBatchDone }: { onUpload: (data: any[], fileName?: string, sourceFile?: File) => void | Promise<void>; disabled?: boolean; maxFileBytes?: number; onBatchStart?: (count: number) => void; onBatchDone?: () => void }) => {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string>('');
  return (
    <div className="oc-card p-6">
      <h2 className="text-lg font-bold text-slate-900 mb-4">Загрузка отчета</h2>
      <div className={`border-2 border-dashed rounded-xl p-4 md:p-8 text-center transition-colors ${disabled || busy ? 'border-slate-200 bg-slate-50' : 'border-slate-200 hover:border-indigo-500'}`}>
        <input
          type="file"
          accept=".xlsx, .xls"
          multiple
          disabled={disabled || busy}
          onChange={async (e) => {
            const files = Array.from(e.target.files || []);
            if (!files.length) return;

            const errors: string[] = [];
            setBusy(true);
            try { onBatchStart?.(files.length); } catch (_) {}

            try {
              for (let fi = 0; fi < files.length; fi += 1) {
                const file = files[fi];
                setProgress(files.length > 1 ? `Файл ${fi + 1} из ${files.length}: ${file.name}` : `Обработка: ${file.name}`);
                if (fi > 0) {
                  await new Promise((r) => setTimeout(r, 200));
                }
                try {
                  const fileSizeError = ensureExcelFileSize(file, maxFileBytes);
                  if (fileSizeError) {
                    errors.push(`${file.name}: ${fileSizeError}`);
                    continue;
                  }

                  // Parsed in a Web Worker → UI stays responsive even for 60k+ rows.
                  const data = await readFirstSheetAsJsonFast(file);
                  if (Array.isArray(data)) {
                    const rowLimitError = ensureExcelRowLimit(data.length);
                    if (rowLimitError) {
                      errors.push(`${file.name}: ${rowLimitError}`);
                      continue;
                    }
                  }

                  await onUpload(data, file.name, file);
                } catch (error: any) {
                  errors.push(`${file.name}: ${error?.message || 'неизвестно'}`);
                }
              }

              if (errors.length) {
                alert(`Часть файлов не обработана:\n\n${errors.slice(0, 8).join('\n')}`);
              }
            } finally {
              setBusy(false);
              setProgress('');
              if (e.target) e.target.value = '';
              try { onBatchDone?.(); } catch (_) {}
            }
          }}
          className="hidden"
          id="excel-upload"
        />
        <label htmlFor="excel-upload" className={`flex flex-col items-center ${disabled || busy ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
          <div className="p-4 bg-indigo-50 rounded-full mb-4">
            {busy ? <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" /> : <Upload className="h-8 w-8 text-indigo-600" />}
          </div>
          <span className="text-slate-900 font-medium">{busy ? 'Обработка файла…' : disabled ? 'Сначала выберите поставщика' : 'Нажмите для загрузки'}</span>
          <span className="text-sm text-slate-500 mt-1">{busy ? (progress || 'Парсинг в фоне, интерфейс не зависнет') : disabled ? 'Загрузка недоступна без выбранного поставщика' : 'один файл — обычная загрузка; несколько — тихий пакетный режим (без вопросов, сводка в конце)'}</span>
        </label>
      </div>
    </div>
  );
};

export const SectionWrapper = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const SuppliesFBOSection = ({ children }: { children: React.ReactNode }) => <SectionWrapper>{children}</SectionWrapper>;
export const WBProductsSection = ({ children }: { children: React.ReactNode }) => <SectionWrapper>{children}</SectionWrapper>;
export const ReportsSection = ({ children }: { children: React.ReactNode }) => <SectionWrapper>{children}</SectionWrapper>;
export const EmployeesSection = ({ children }: { children: React.ReactNode }) => <SectionWrapper>{children}</SectionWrapper>;
export const TelegramSettingsSection = ({ children }: { children: React.ReactNode }) => <SectionWrapper>{children}</SectionWrapper>;

/**
 * Рамка перетаскиваемого блока в конструкторе этикеток.
 *
 * Только контур и подпись в углу: под рамкой лежит настоящий PDF, и заливка
 * с текстом-заглушкой закрывала бы именно то, ради чего человек сюда смотрит.
 */
export const WbLayoutHandle = ({
  title,
  tone,
  style,
  onMouseDown,
}: {
  title: string;
  tone: 'indigo' | 'emerald' | 'amber' | 'fuchsia' | 'cyan';
  style: React.CSSProperties;
  onMouseDown: (e: React.MouseEvent) => void;
}) => {
  const tones: Record<string, { border: string; chip: string }> = {
    indigo: { border: 'border-indigo-500/80', chip: 'bg-indigo-600' },
    emerald: { border: 'border-emerald-500/80', chip: 'bg-emerald-600' },
    amber: { border: 'border-amber-500/80', chip: 'bg-amber-600' },
    fuchsia: { border: 'border-fuchsia-500/80', chip: 'bg-fuchsia-600' },
    cyan: { border: 'border-cyan-500/80', chip: 'bg-cyan-600' },
  };
  const t = tones[tone] || tones.indigo;

  return (
    <div
      onMouseDown={onMouseDown}
      style={style}
      className={`absolute cursor-move rounded border border-dashed ${t.border} transition hover:border-solid hover:bg-white/10`}
    >
      <span className={`pointer-events-none absolute -top-[9px] left-0 rounded px-1 text-[9px] font-medium leading-[14px] text-white ${t.chip}`}>
        {title}
      </span>
    </div>
  );
};

export const DatamatrixCode = ({ code }: { code: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    ensureBwip().then(() => {
      if (cancelled || !canvasRef.current) return;
      try {
        // С GS-разделителями: без них символ читается кодом на два символа
        // короче настоящего, и такого кода в ГИС МТ не существует.
        lazyLibs.bwipjs.toCanvas(canvasRef.current, {
            bcid: 'datamatrix',
            text: restoreDataMatrixGs(code),
            binarytext: true,
            parsefnc: false,
            scale: 3,
            height: 10,
            includetext: false,
            textxalign: 'center',
        });
      } catch (e) {
        console.error(e);
      }
    });
    return () => { cancelled = true; };
  }, [code]);

  return (
    <div className="sticker w-[58mm] h-[40mm] flex flex-col items-center justify-center p-2 bg-white break-inside-avoid">
        <canvas ref={canvasRef} className="max-w-full max-h-[30mm]" />
        <div className="text-[8px] mt-1 text-center break-all leading-tight max-w-full overflow-hidden h-[8px]">
            {code}
        </div>
    </div>
  );
};
