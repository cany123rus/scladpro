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

let pluginPromise: Promise<any> | null = null;

/**
 * Дожидается готовности плагина.
 *
 * Объект `cadesplugin` появляется двумя путями: его создаёт скрипт
 * cadesplugin_api.js от КриптоПро, либо — в некоторых сборках — расширение
 * браузера. Пробуем оба и говорим человеку понятную причину, если не вышло:
 * «кнопка не работает» — худшее, что можно оставить складу.
 */
export function loadCadesPlugin(): Promise<any> {
  if (pluginPromise) return pluginPromise;

  pluginPromise = new Promise((resolve, reject) => {
    const settle = () => {
      const plugin = window.cadesplugin;
      if (!plugin) {
        reject(new Error('Плагин КриптоПро не найден. Установите «КриптоПро ЭЦП Browser plug-in» и расширение в браузере.'));
        return;
      }
      Promise.resolve(plugin)
        .then(() => resolve(plugin))
        .catch((e: any) =>
          reject(new Error(`Плагин установлен, но не отвечает: ${e?.message || e}. Проверьте, что расширение включено.`)),
        );
    };

    if (window.cadesplugin) {
      settle();
      return;
    }

    const script = document.createElement('script');
    script.src = '/cadesplugin_api.js';
    script.onload = () => setTimeout(settle, 0);
    script.onerror = () =>
      reject(
        new Error(
          'Не найден файл /cadesplugin_api.js. Его даёт КриптоПро вместе с плагином — положите файл в папку public проекта.',
        ),
      );
    document.head.appendChild(script);
  });

  return pluginPromise;
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
  const plugin = await loadCadesPlugin();

  const store = await plugin.CreateObjectAsync('CAdESCOM.Store');
  await store.Open(CAPICOM_CURRENT_USER_STORE, CAPICOM_MY_STORE, CAPICOM_STORE_OPEN_READ_ONLY);

  try {
    const certificates = await store.Certificates;
    const count = await certificates.Count;
    const out: CertificateInfo[] = [];

    for (let i = 1; i <= count; i++) {
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
    }

    return out;
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
export async function signDetachedBase64(base64Data: string, thumbprint: string): Promise<string> {
  const plugin = await loadCadesPlugin();

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

    const signature = await signedData.SignCades(signer, CADESCOM_CADES_BES, true, CAPICOM_ENCODE_BASE64);
    return String(signature).replace(/[\r\n]/g, '');
  } finally {
    try {
      await store.Close();
    } catch {
      // см. выше
    }
  }
}
