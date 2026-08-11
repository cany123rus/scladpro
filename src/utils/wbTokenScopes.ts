/**
 * Категории доступа в токене WB.
 *
 * Токен — это JWT, и набор разрешённых категорий лежит прямо в нём полем `s`
 * (битовая маска). Значит, до запроса можно понять, что кабинету откажут, и
 * сказать об этом словами вместо сырого «401 token scope not allowed».
 *
 * Проверено 11.08.2026: у «Постельки» в токене нет «Маркетплейса», и все
 * вызовы marketplace-api отвечали 401, хотя реклама и статистика работали —
 * человек искал причину в кабинете Власенко, где всё было исправно.
 */

export const WB_SCOPES = {
  content: 1 << 1,
  analytics: 1 << 2,
  prices: 1 << 3,
  marketplace: 1 << 4,
  statistics: 1 << 5,
  promotion: 1 << 6,
  feedbacks: 1 << 7,
  recommendations: 1 << 8,
  chat: 1 << 9,
  supplies: 1 << 10,
  returns: 1 << 11,
  documents: 1 << 12,
} as const;

export type WbScope = keyof typeof WB_SCOPES;

export const WB_SCOPE_NAMES: Record<WbScope, string> = {
  content: 'Контент',
  analytics: 'Аналитика',
  prices: 'Цены и скидки',
  marketplace: 'Маркетплейс',
  statistics: 'Статистика',
  promotion: 'Продвижение',
  feedbacks: 'Вопросы и отзывы',
  recommendations: 'Рекомендации',
  chat: 'Чат с покупателями',
  supplies: 'Поставки',
  returns: 'Возвраты покупателями',
  documents: 'Документы',
};

export interface WbTokenInfo {
  /** Разобрался ли токен. Нет — молчим и пропускаем вперёд: решает сервер. */
  parsed: boolean;
  scopes: WbScope[];
  expiresAt: Date | null;
  expired: boolean;
  /** Токен тестового контура: боевых данных им не получить. */
  sandbox: boolean;
}

export function readWbToken(token: string): WbTokenInfo {
  const empty: WbTokenInfo = { parsed: false, scopes: [], expiresAt: null, expired: false, sandbox: false };
  const part = String(token ?? '').trim().split('.')[1];
  if (!part) return empty;

  try {
    // base64url → base64: атоб не понимает «-» и «_».
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(decodeURIComponent(escape(atob(base64)))) as { s?: number; exp?: number; t?: boolean };
    const mask = Number(payload?.s ?? 0);
    const exp = Number(payload?.exp ?? 0);
    const expiresAt = exp > 0 ? new Date(exp * 1000) : null;

    return {
      parsed: true,
      scopes: (Object.keys(WB_SCOPES) as WbScope[]).filter((k) => (mask & WB_SCOPES[k]) !== 0),
      expiresAt,
      expired: Boolean(expiresAt && expiresAt.getTime() < Date.now()),
      sandbox: Boolean(payload?.t),
    };
  } catch {
    return empty;
  }
}

/** Есть ли у токена нужная категория. Неразобранный токен не блокируем. */
export function hasWbScope(token: string, scope: WbScope): boolean {
  const info = readWbToken(token);
  return !info.parsed || info.scopes.includes(scope);
}

/**
 * Понятное объяснение, почему запрос обречён, — или null, если всё в порядке.
 *
 * Пишем на языке кабинета продавца: там категории называются именно так, и
 * человеку остаётся перевыпустить ключ, а не гадать, что такое scope.
 */
export function explainWbAccess(token: string, scope: WbScope, cabinet?: string): string | null {
  const info = readWbToken(token);
  if (!info.parsed) return null;

  const who = cabinet ? `«${cabinet}»` : 'кабинета';
  if (info.expired) {
    return `Токен ${who} просрочен (истёк ${info.expiresAt?.toLocaleDateString('ru-RU')}). `
      + 'Перевыпустите ключ в кабинете продавца → Настройки → Доступ к API.';
  }
  if (!info.scopes.includes(scope)) {
    return `У токена ${who} нет категории «${WB_SCOPE_NAMES[scope]}» — WB такие запросы не пропустит. `
      + `Есть: ${info.scopes.map((s) => WB_SCOPE_NAMES[s]).join(', ') || 'ничего'}. `
      + 'Перевыпустите ключ, отметив нужную категорию.';
  }
  if (info.sandbox) {
    return `Токен ${who} выписан на тестовый контур — боевых данных по нему не будет.`;
  }
  return null;
}
