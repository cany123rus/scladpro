import React, { useMemo, useState } from 'react';
import {
  BookOpen, Truck, ShieldCheck, ShoppingBag, BarChart2, Users, Wallet,
  Database, Moon, Camera, CheckSquare, ScanLine, Send,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────
// Раздел «Инструкция» — подробное руководство по сайту.
// Самодостаточный компонент: без внешнего состояния. Иллюстрации — inline SVG.
// ─────────────────────────────────────────────────────────────────────────

type Section = {
  id: string;
  title: string;
  icon: any;
  color: string; // tailwind text color for the icon bubble
  bg: string;     // tailwind bg for the icon bubble
  body: React.ReactNode;
};

// Маленький переиспользуемый «скриншот-макет» окна приложения.
const ScreenMock = ({ title, children }: { title: string; children?: React.ReactNode }) => (
  <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden my-3" data-no-invert>
    <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 border-b border-slate-200">
      <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
      <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
      <span className="ml-2 text-[11px] font-medium text-slate-500">{title}</span>
    </div>
    <div className="p-3">{children}</div>
  </div>
);

// Шаги «1 → 2 → 3».
const Steps = ({ items }: { items: string[] }) => (
  <ol className="space-y-2 my-3">
    {items.map((t, i) => (
      <li key={i} className="flex gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold">{i + 1}</span>
        <span className="text-sm text-slate-700 leading-relaxed">{t}</span>
      </li>
    ))}
  </ol>
);

const Note = ({ tone = 'info', children }: { tone?: 'info' | 'warn' | 'ok'; children: React.ReactNode }) => {
  const map: Record<string, string> = {
    info: 'border-indigo-200 bg-indigo-50 text-indigo-800',
    warn: 'border-amber-200 bg-amber-50 text-amber-800',
    ok: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  };
  return <div className={`rounded-xl border px-3 py-2 text-sm my-3 ${map[tone]}`}>{children}</div>;
};

// Иллюстрация процесса сканирования FBO.
const ScanFlowSVG = () => (
  <svg viewBox="0 0 520 120" className="w-full max-w-xl my-3" data-no-invert>
    {[
      { x: 10, label: 'Поставщик', sub: 'QR / штрихкод', c: '#6366f1' },
      { x: 140, label: 'Коробка', sub: 'создать/№', c: '#0ea5e9' },
      { x: 270, label: 'Товар (ШК)', sub: 'из базы WB', c: '#10b981' },
      { x: 400, label: 'Честный знак', sub: 'DataMatrix', c: '#f59e0b' },
    ].map((b, i) => (
      <g key={i}>
        <rect x={b.x} y={28} width={110} height={56} rx={10} fill="#fff" stroke={b.c} strokeWidth={2} />
        <text x={b.x + 55} y={52} textAnchor="middle" fontSize={13} fontWeight={700} fill="#1e293b">{b.label}</text>
        <text x={b.x + 55} y={70} textAnchor="middle" fontSize={10} fill="#64748b">{b.sub}</text>
        {i < 3 && <path d={`M${b.x + 110} 56 L${b.x + 130} 56`} stroke="#94a3b8" strokeWidth={2} markerEnd="url(#arr)" />}
      </g>
    ))}
    <defs>
      <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="#94a3b8" /></marker>
    </defs>
  </svg>
);

const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[12px] font-mono font-medium text-slate-700">{children}</span>
);

export function InstructionTab() {
  const [active, setActive] = useState('start');

  const sections: Section[] = useMemo(() => [
    {
      id: 'start', title: 'Начало работы', icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-100',
      body: (
        <>
          <p className="text-sm text-slate-700 leading-relaxed">СкладПро — рабочая панель для приёмки FBO, печати Честных Знаков, аналитики Wildberries, учёта сотрудников и складских денег. Слева — меню разделов, сверху — переключатель <b>ночного режима</b> и статус соединения.</p>
          <Steps items={[
            'Войдите по логину/паролю или отсканируйте свой QR-код входа.',
            'Выберите раздел в левом меню. Набор разделов зависит от ваших прав.',
            'Сканер штрихкодов работает как «быстрая клавиатура» — просто наведите и считайте код, нажимать ничего не нужно.',
          ]} />
          <Note tone="info">Если данные не обновились после изменений — обновите страницу (Ctrl+F5). Приложение кэширует оболочку для офлайна.</Note>
        </>
      ),
    },
    {
      id: 'supplies', title: 'Поставки FBO — приёмка и сборка', icon: Truck, color: 'text-sky-600', bg: 'bg-sky-100',
      body: (
        <>
          <p className="text-sm text-slate-700 leading-relaxed">Главный рабочий раздел склада: приёмка поставки, раскладка по коробкам, сканирование товара и Честного Знака.</p>
          <ScanFlowSVG />
          <Steps items={[
            'Отсканируйте штрихкод поставщика (или выберите поставку из списка).',
            'Создайте/откройте коробку: отсканируйте штрихкод коробки или сгенерируйте новую.',
            'Сканируйте штрихкод товара (ШК) — система найдёт его в базе «Товары WB» этого поставщика.',
            'Сканируйте Честный Знак (DataMatrix) — товар добавится в коробку.',
            'Повторяйте; для новой коробки используйте QR «генерация коробки», для закрытия — QR «новая коробка».',
          ]} />
          <Note tone="warn">Чужой товар не примут: если ШК принадлежит другому поставщику — будет ошибка «товар не добавлен». Дубль Честного Знака тоже отклоняется — ЧЗ уникален для каждой единицы.</Note>
          <ScreenMock title="Поставки FBO · сканирование">
            <div className="flex items-center gap-2 text-sm">
              <ScanLine className="h-5 w-5 text-emerald-600" />
              <span className="text-slate-600">Поле: «Сканируйте штрихкод товара…», затем «Честный Знак»</span>
            </div>
          </ScreenMock>
          <p className="text-sm text-slate-700"><b>Учёт сборщика (для админа):</b> вверху раздела — плашка «Сканирует: …». Сотрудник сканирует свой бейдж <Badge>WRK:…</Badge>, и его сборки засчитываются ему. Включается в «Права кнопок».</p>
        </>
      ),
    },
    {
      id: 'honest_sign', title: 'Честный Знак / Печать', icon: ShieldCheck, color: 'text-violet-600', bg: 'bg-violet-100',
      body: (
        <>
          <p className="text-sm text-slate-700 leading-relaxed">Загрузка кодов маркировки, печать этикеток и контроль базы ЧЗ по поставщику.</p>
          <Steps items={[
            'Выберите поставщика.',
            'Загрузите коды в базу (вкладка «База») — дубликаты отсеются автоматически.',
            'Печать этикеток ЧЗ — во вкладке печати; отсканированные коды видны во вкладке «Отсканированные».',
          ]} />
          <Note tone="info">База ЧЗ — общая по поставщику: один и тот же код нельзя отсканировать дважды.</Note>
        </>
      ),
    },
    {
      id: 'wb_products', title: 'Товары WB', icon: ShoppingBag, color: 'text-fuchsia-600', bg: 'bg-fuchsia-100',
      body: (
        <>
          <p className="text-sm text-slate-700 leading-relaxed">Кэш карточек Wildberries по поставщику: штрихкоды, размеры, фото, артикулы. Используется при сканировании в поставках.</p>
          <Steps items={[
            'Выберите поставщика и нажмите «Обновить» — подтянутся карточки из WB по API-токену поставщика.',
            'Если при сканировании «товар не найден» — обновите кэш в этом разделе.',
          ]} />
        </>
      ),
    },
    {
      id: 'analytics', title: 'Аналитика и Отчёты', icon: BarChart2, color: 'text-emerald-600', bg: 'bg-emerald-100',
      body: (
        <>
          <p className="text-sm text-slate-700 leading-relaxed">Загрузка отчёта реализации WB и полная финансовая сводка: продажи, прибыль, рентабельность, логистика, возвраты.</p>
          <Steps items={[
            'Загрузите Excel-отчёт реализации WB (или откройте сохранённый из истории).',
            'Заполните себестоимость товаров (кнопка «Редактировать себестоимость») — без неё прибыль/ROI неполные.',
            'Смотрите вкладку «Сводка»: показатели, графики по дням, структура расходов.',
            'Вкладка «Таблица» — по каждому товару: продано, продажи, маржа, рентабельность, прибыль, ABC, возвраты.',
          ]} />
          <ScreenMock title="Сводка · ключевые показатели">
            <div className="grid grid-cols-3 gap-2 text-center">
              {[['Продажи', 'bg-indigo-50 text-indigo-700'], ['Чистая прибыль', 'bg-emerald-50 text-emerald-700'], ['ROI', 'bg-teal-50 text-teal-700'], ['Логистика %', 'bg-blue-50 text-blue-700'], ['Возвраты', 'bg-rose-50 text-rose-700'], ['Налог', 'bg-slate-50 text-slate-700']].map(([t, c], i) => (
                <div key={i} className={`rounded-lg p-2 text-[11px] font-semibold ${c}`}>{t}</div>
              ))}
            </div>
          </ScreenMock>
          <p className="text-sm text-slate-700"><b>Полезное:</b> ABC-анализ (A — топ-товары до 80% выручки), «Неликвид» (нет продаж за период), скорость продаж (ед/день), рентабельность по каждому товару.</p>
        </>
      ),
    },
    {
      id: 'completed', title: 'Сборка (учёт работы)', icon: CheckSquare, color: 'text-amber-600', bg: 'bg-amber-100',
      body: (
        <>
          <p className="text-sm text-slate-700 leading-relaxed">Календарь смен, расценки, упаковка, закуп и временные сотрудники.</p>
          <Steps items={[
            'В «Расценках» задайте цены за операции (сборка ФБО/ФБС и т.п.).',
            'Вносите выработку сотрудников по дням — заработок считается автоматически.',
            'Временные сотрудники — отдельная вкладка: добавление/редактирование смены, оплаты.',
          ]} />
        </>
      ),
    },
    {
      id: 'suppliers', title: 'Поставщики и Деньги на складе', icon: Wallet, color: 'text-rose-600', bg: 'bg-rose-100',
      body: (
        <>
          <p className="text-sm text-slate-700 leading-relaxed">Карточки поставщиков (API-токены WB, Telegram chat_id) и учёт денег на складе по владельцам счетов.</p>
          <Steps items={[
            'Заполните у поставщика Telegram chat_id и привяжите его к счёту «Деньги на складе».',
            'При оплате доставки сумма автоматически списывается со счёта и приходит уведомление в Telegram.',
            'Кнопка «Telegram» на карточке денег — отправляет всю историю операций привязанному поставщику.',
          ]} />
          <Note tone="warn">Чтобы уведомления доходили, получатель должен открыть бота списаний и нажать «Старт». Иначе Telegram вернёт «chat not found» — теперь причина показывается в всплывающем сообщении.</Note>
        </>
      ),
    },
    {
      id: 'employees', title: 'Сотрудники и KPI', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100',
      body: (
        <>
          <p className="text-sm text-slate-700 leading-relaxed">Управление сотрудниками, права доступа, лог действий и <b>Дашборд смены + KPI</b> (вверху раздела).</p>
          <Steps items={[
            'Добавляйте сотрудников, задавайте роль, пароль и права на разделы/кнопки.',
            'Дашборд смены: собрано сегодня, выработка за период, средняя скорость.',
            'KPI-рейтинг: выработка, смены, скорость (ед/ч при смене 10 ч), заработок и средняя цена сборки.',
            'Лог действий — кто что менял; «Перейти к данным» открывает нужную запись.',
          ]} />
          <Note tone="info">Скорость считается из расчёта реальной смены 10 часов, а не из условных часов в логах.</Note>
        </>
      ),
    },
    {
      id: 'database', title: 'База данных и бэкапы', icon: Database, color: 'text-blue-600', bg: 'bg-blue-100',
      body: (
        <>
          <p className="text-sm text-slate-700 leading-relaxed">Резервные копии базы, восстановление и история версий.</p>
          <Steps items={[
            'Кнопка «Создать бэкап» — формирует полную копию; «Скачать базу» — выгружает JSON.',
            'В истории у каждого бэкапа есть кнопка «Скачать».',
            'Восстановление — загрузка JSON-бэкапа (осторожно: заменяет данные).',
          ]} />
        </>
      ),
    },
    {
      id: 'extra', title: 'Ночной режим, Камеры, Задачи', icon: Moon, color: 'text-slate-600', bg: 'bg-slate-100',
      body: (
        <>
          <ul className="space-y-2 text-sm text-slate-700">
            <li className="flex gap-2"><Moon className="h-4 w-4 mt-0.5 text-slate-500" /> <span><b>Ночной режим</b> — кнопка луна/солнце в шапке, работает во всех разделах, выбор запоминается.</span></li>
            <li className="flex gap-2"><Camera className="h-4 w-4 mt-0.5 text-slate-500" /> <span><b>Камеры</b> — просмотр видеопотоков склада.</span></li>
            <li className="flex gap-2"><CheckSquare className="h-4 w-4 mt-0.5 text-slate-500" /> <span><b>Задачи</b> — постановка и отслеживание задач команды.</span></li>
            <li className="flex gap-2"><Send className="h-4 w-4 mt-0.5 text-slate-500" /> <span><b>Telegram-боты</b> — приём файлов от поставщиков и уведомления.</span></li>
          </ul>
        </>
      ),
    },
  ], []);

  const current = sections.find((s) => s.id === active) || sections[0];

  return (
    <div className="mx-auto max-w-6xl">
      {/* Заголовок */}
      <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-violet-900 to-slate-900 p-6 shadow-xl ring-1 ring-white/10">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
            <BookOpen className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Инструкция</h1>
            <p className="mt-1 text-sm text-indigo-100/80">Подробное руководство по всем разделам СкладПро</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5">
        {/* Навигация по разделам */}
        <nav className="lg:sticky lg:top-4 self-start oc-card p-2">
          <div className="px-2 py-2 text-[11px] font-semibold uppercase text-slate-400">Содержание</div>
          {sections.map((s) => {
            const on = s.id === active;
            return (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-left transition-colors ${on ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${s.bg} ${s.color}`}><s.icon className="h-4 w-4" /></span>
                <span className="leading-tight">{s.title}</span>
              </button>
            );
          })}
        </nav>

        {/* Контент раздела */}
        <article className="oc-card p-5 sm:p-6">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${current.bg} ${current.color}`}><current.icon className="h-6 w-6" /></span>
            <h2 className="text-xl font-bold text-slate-900">{current.title}</h2>
          </div>
          {current.body}
        </article>
      </div>
    </div>
  );
}
