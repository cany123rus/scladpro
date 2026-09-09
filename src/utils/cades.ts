/**
 * Подпись УКЭП через КриптоПро ЭЦП Browser plug-in.
 *
 * Ключ не должен покидать компьютер сотрудника, поэтому подписываем в браузере,
 * а в ГИС МТ ходит сервер: их API не отдаёт CORS-заголовки, и запрос со
 * страницы до него всё равно не доедет.
 *
 * API плагина полностью асинхронный и построен на COM-объектах, отсюда
 * непривычные `CreateObjectAsync` и числовые константы — это не наш выбор
 * стиля, а то, как устроен сам плагин.
 */

declare global {
  interface Window {
    cadesplugin?: any;
  }
}

/** Константы CAPICOM/CAdESCOM. Имена — из документации КриптоПро. */
const CAPICOM_CURRENT_USER_STORE = 2;
const CAPICOM_MY_STORE = 'My';
const CAPICOM_STORE_OPEN_READ_ONLY = 0;
const CAPICOM_CERTIFICATE_FIND_SHA1_HASH = 0;
const CADESCOM_BASE64_TO_BINARY = 1;
const CADESCOM_CADES_BES = 1;
const CAPICOM_ENCODE_BASE64 = 0;

let pluginPromise: Promise<void> | null = null;

/*
 * Готовый объект плагина берём отдельной функцией, а не возвращаем из промиса.
 *
 * `cadesplugin` — thenable: у него есть собственный `then`, и промис-машинерия
 * его «усыновляет». Асинхронная функция, вернувшая этот объект, отдаёт наружу
 * не его, а результат его `then` — то есть undefined, потому что КриптоПро
 * вызывает resolve без аргументов. Наружу уходило `undefined`, и первое же
 * обращение падало с «Cannot read properties of undefined».
 */
export function cadesApi(): any {
  const plugin = window.cadesplugin;
  if (!plugin) throw new Error('Плагин КриптоПро ещё не готов');
  return plugin;
}

/**
 * Дожидается готовности плагина.
 *
 * Объект `cadesplugin` появляется двумя путями: его создаёт скрипт
 * cadesplugin_api.js от КриптоПро, либо — в некоторых сборках — расширение
 * браузера. Пробуем оба и говорим человеку понятную причину, если не вышло:
 * «кнопка не работает» — худшее, что можно оставить складу.
 */
export function loadCadesPlugin(): Promise<void> {
  if (pluginPromise) return pluginPromise;

  pluginPromise = (async () => {
    if (window.cadesplugin) {
      await waitReady(window.cadesplugin);
      return;
    }

    /*
     * Сначала убеждаемся, что файл вообще лежит на сайте.
     *
     * Хостинг отдаёт index.html на любой неизвестный адрес, поэтому пропавший
     * cadesplugin_api.js «загружался» успешно: браузер честно выполнял HTML как
     * скрипт, объект не появлялся, и раздел писал «плагин не найден» — хотя
     * плагин стоял, а не хватало нашего файла. Проверяем содержимое до вставки.
     */
    let source: string;
    try {
      const res = await fetch('/cadesplugin_api.js', { cache: 'no-store' });
      source = res.ok ? await res.text() : '';
    } catch {
      source = '';
    }

    if (!source || /^\s*<!doctype html|^\s*<html/i.test(source)) {
      throw new Error(
        'На сайте нет файла cadesplugin_api.js — это часть КриптоПро, её нужно положить рядом с сайтом. '
          + 'Скачайте файл со страницы КриптоПро (cryptopro.ru/cadesplugin, ссылка «Демо-страница» → сохранить cadesplugin_api.js) и передайте мне.',
      );
    }

    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/cadesplugin_api.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Файл cadesplugin_api.js не выполнился'));
      document.head.appendChild(script);
    });

    // Объект создаётся синхронно самим файлом, но дадим ему такт на инициализацию.
    await new Promise((r) => setTimeout(r, 0));

    if (!window.cadesplugin) {
      throw new Error('Файл cadesplugin_api.js загрузился, но объект плагина не появился — проверьте версию файла.');
    }

    await waitReady(window.cadesplugin);
  })();

  return pluginPromise;
}

/**
 * Готовность плагина.
 *
 * `cadesplugin` — промис: он отклоняется, если расширения нет в этом профиле
 * браузера или не установлен сам КриптоПро CSP. Различить это по тексту от
 * КриптоПро сложно, поэтому подсказываем оба варианта: расширение ставится в
 * конкретный профиль, и «стоит в другом профиле» — самая частая причина.
 */
async function waitReady(plugin: any): Promise<void> {
  try {
    await Promise.resolve(plugin);
  } catch (e: any) {
    throw new Error(
      `Расширение КриптоПро не отвечает (${e?.message || e}). `
        + 'Проверьте, что расширение включено именно в том профиле браузера, где открыт СкладПро, и что установлен КриптоПро CSP.',
    );
  }
}

export interface CertificateInfo {
  thumbprint: string;
  subject: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  inn: string;
  organization: string;
}

/** ИНН прячется в теме сертификата рядом с прочими полями. */
const extractInn = (subject: string) => {
  const match = String(subject || '').match(/ИНН(?:\s*ЮЛ)?\s*=\s*(\d{10,12})/i);
  return match ? match[1] : '';
};

const extractOrganization = (subject: string) => {
  const match = String(subject || '').match(/(?:^|,)\s*(?:CN|О|O)\s*=\s*([^,]+)/);
  return match ? match[1].trim() : '';
};

/** Сертификаты из личного хранилища Windows — только действующие. */
export async function listCertificates(): Promise<CertificateInfo[]> {
  await loadCadesPlugin();
  const plugin = cadesApi();

  const store = await plugin.CreateObjectAsync('CAdESCOM.Store');
  await store.Open(CAPICOM_CURRENT_USER_STORE, CAPICOM_MY_STORE, CAPICOM_STORE_OPEN_READ_ONLY);

  try {
    const certificates = await store.Certificates;
    const count = await certificates.Count;
    const out: CertificateInfo[] = [];

    for (let i = 1; i <= count; i++) {
      /*
       * Каждый сертификат читаем отдельно и падение глотаем.
       *
       * В хранилище копятся старые сертификаты, чьи ключи лежат на носителях,
       * давно вынутых из компьютера. На таком КриптоПро показывает модальное
       * «Выбор ключевого носителя», и если нажать «Отмена», обращение падает.
       * Раньше это роняло весь перебор — вместе с действующим сертификатом,
       * который лежал в списке следом.
       */
      try {
        const cert = await certificates.Item(i);
        const subject = String(await cert.SubjectName);
        const validTo = new Date(String(await cert.ValidToDate));

        // Просроченные не показываем: выбрать такой можно только по ошибке,
        // а ГИС МТ откажет уже после подписи, когда виноватым выглядит сайт.
        if (validTo.getTime() < Date.now()) continue;

        out.push({
          thumbprint: String(await cert.Thumbprint),
          subject,
          issuer: String(await cert.IssuerName),
          validFrom: new Date(String(await cert.ValidFromDate)).toISOString(),
          validTo: validTo.toISOString(),
          inn: extractInn(subject),
          organization: extractOrganization(subject),
        });
      } catch (e) {
        console.warn('Сертификат пропущен при переборе', e);
      }
    }

    // Свежие первыми: у одного ИНН бывает несколько сертификатов, и подписывать
    // надо последним выданным, а не тем, что первым попался в хранилище.
    return out.sort((a, b) => b.validTo.localeCompare(a.validTo));
  } finally {
    try {
      await store.Close();
    } catch {
      // хранилище всё равно закроется вместе со страницей
    }
  }
}

/**
 * Открепленная подпись CAdES-BES в base64.
 *
 * ГИС МТ ждёт подпись одной строкой, без переносов: плагин расставляет их сам,
 * и с ними сервер отвечает «подпись невалидна» — ошибка, по которой ни за что
 * не догадаться, что дело в переводах строк.
 */
export async function signDetachedBase64(
  base64Data: string,
  thumbprint: string,
  detached = true,
): Promise<string> {
  await loadCadesPlugin();
  const plugin = cadesApi();

  const store = await plugin.CreateObjectAsync('CAdESCOM.Store');
  await store.Open(CAPICOM_CURRENT_USER_STORE, CAPICOM_MY_STORE, CAPICOM_STORE_OPEN_READ_ONLY);

  try {
    const certificates = await store.Certificates;
    const found = await certificates.Find(CAPICOM_CERTIFICATE_FIND_SHA1_HASH, thumbprint);
    const count = await found.Count;
    if (!count) throw new Error('Сертификат не найден в хранилище — возможно, вынут токен');

    const cert = await found.Item(1);

    const signer = await plugin.CreateObjectAsync('CAdESCOM.CPSigner');
    await signer.propset_Certificate(cert);

    const signedData = await plugin.CreateObjectAsync('CAdESCOM.CadesSignedData');
    await signedData.propset_ContentEncoding(CADESCOM_BASE64_TO_BINARY);
    await signedData.propset_Content(base64Data);

    const signature = await signedData.SignCades(signer, CADESCOM_CADES_BES, detached, CAPICOM_ENCODE_BASE64);
    return String(signature).replace(/[\r\n]/g, '');
  } finally {
    try {
      await store.Close();
    } catch {
      // см. выше
    }
  }
}
