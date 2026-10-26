/**
 * Поведение полей, общее для всего сайта.
 *
 * В числовом поле при входе выделяем число целиком: количество и цену меняют,
 * а не дописывают, и удалять старое значение по символу незачем. Одна подписка
 * на документ вместо правки каждого из десятков полей.
 */
export function installInputEnhancements() {
  if (typeof document === 'undefined') return;
  document.addEventListener('focusin', (e) => {
    const t = e.target;
    if (t instanceof HTMLInputElement && t.type === 'number' && !t.readOnly && !t.disabled) {
      // Следующим кадром: иначе mouseup браузера снимает выделение, поставленное при фокусе.
      requestAnimationFrame(() => { try { t.select(); } catch { /* тип не поддерживает выделение */ } });
    }
  });
}
