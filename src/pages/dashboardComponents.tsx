// Small presentational components extracted from Dashboard.tsx.
import React, { useEffect, useRef } from 'react';
import { Upload } from 'lucide-react';
import { ensureExcelFileSize, ensureExcelRowLimit, readFirstSheetAsJson } from '../utils/safeExcel';
import { ensureBwip, lazyLibs } from './dashboardLazyLibs';

export const ExcelUploader = ({ onUpload, disabled = false, maxFileBytes }: { onUpload: (data: any[], fileName?: string, sourceFile?: File) => void | Promise<void>; disabled?: boolean; maxFileBytes?: number }) => {
  return (
    <div className="oc-card p-6">
      <h2 className="text-lg font-bold text-slate-900 mb-4">Загрузка отчета</h2>
      <div className={`border-2 border-dashed rounded-xl p-4 md:p-8 text-center transition-colors ${disabled ? 'border-slate-200 bg-slate-50' : 'border-slate-200 hover:border-indigo-500'}`}>
        <input
          type="file"
          accept=".xlsx, .xls"
          multiple
          disabled={disabled}
          onChange={async (e) => {
            const files = Array.from(e.target.files || []);
            if (!files.length) return;

            const errors: string[] = [];

            try {
              for (let fi = 0; fi < files.length; fi += 1) {
                const file = files[fi];
                if (fi > 0) {
                  await new Promise((r) => setTimeout(r, 350));
                }
                try {
                  const fileSizeError = ensureExcelFileSize(file, maxFileBytes);
                  if (fileSizeError) {
                    errors.push(`${file.name}: ${fileSizeError}`);
                    continue;
                  }

                  const buff = await file.arrayBuffer();
                  const data = await readFirstSheetAsJson(buff);
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
              if (e.target) e.target.value = '';
            }
          }}
          className="hidden"
          id="excel-upload"
        />
        <label htmlFor="excel-upload" className={`flex flex-col items-center ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
          <div className="p-4 bg-indigo-50 rounded-full mb-4">
            <Upload className="h-8 w-8 text-indigo-600" />
          </div>
          <span className="text-slate-900 font-medium">{disabled ? 'Сначала выберите поставщика' : 'Нажмите для загрузки'}</span>
          <span className="text-sm text-slate-500 mt-1">{disabled ? 'Загрузка недоступна без выбранного поставщика' : 'можно выбрать один или несколько файлов Excel'}</span>
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

export const DatamatrixCode = ({ code }: { code: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    ensureBwip().then(() => {
      if (cancelled || !canvasRef.current) return;
      try {
        lazyLibs.bwipjs.toCanvas(canvasRef.current, {
            bcid: 'datamatrix',
            text: code,
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
