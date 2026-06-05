import React from 'react';

export type CameraStream = { name: string; url: string };

type CamerasTabProps = {
  cameraStreams: CameraStream[];
  setCameraStreams: React.Dispatch<React.SetStateAction<CameraStream[]>>;
  currentEmployee?: { role?: string | null; login?: string | null } | null;
  showToast: (message: string, type?: string) => void;
};

const normalizeRoleKey = (role?: string | null) => String(role || '').trim().toLowerCase();

export function CamerasTab({ cameraStreams, setCameraStreams, currentEmployee, showToast }: CamerasTabProps) {
  const isAdmin = normalizeRoleKey(currentEmployee?.role || currentEmployee?.login) === 'admin';

  return (
    <div className="max-w-full mx-auto px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Камеры</h1>
        <p className="text-gray-500 mt-1">Потоки в реальном времени. Для вывода в браузере используй HTTP/HLS/WebRTC URL. RTSP можно открыть во внешнем плеере.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {cameraStreams.map((cam, idx) => {
          const isHttp = /^https?:\/\//i.test(cam.url);
          const isRtsp = /^rtsp:\/\//i.test(cam.url);
          return (
            <div key={`cam-${idx}`} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <div className="grid grid-cols-1 gap-2 mb-3">
                <input
                  value={cam.name}
                  onChange={(e) => setCameraStreams((prev) => prev.map((x, i) => i === idx ? { ...x, name: e.target.value } : x))}
                  className="px-3 py-2 border border-gray-300 rounded-lg w-full"
                  placeholder={`Камера ${idx + 1}`}
                />
                <input
                  value={cam.url}
                  onChange={(e) => setCameraStreams((prev) => prev.map((x, i) => i === idx ? { ...x, url: e.target.value } : x))}
                  className="px-3 py-2 border border-gray-300 rounded-lg w-full"
                  placeholder="rtsp://... или https://..."
                />
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden min-h-[220px] flex items-center justify-center">
                {isHttp && cam.url.includes('/stream.html') ? (
                  (() => {
                    const m = /[?&]src=([^&]+)/i.exec(cam.url);
                    const srcName = m ? decodeURIComponent(m[1]) : '';
                    const mp4Url = srcName ? `https://cam.scladpro.ru/api/stream.mp4?src=${encodeURIComponent(srcName)}` : cam.url;
                    return (
                      <video
                        src={mp4Url}
                        controls
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-[260px] object-contain bg-black"
                      />
                    );
                  })()
                ) : isHttp ? (
                  <video src={cam.url} controls autoPlay muted playsInline className="w-full h-[260px] object-cover bg-black" />
                ) : isRtsp ? (
                  <div className="p-4 text-sm text-gray-600 text-center">
                    RTSP-поток в браузере не воспроизводится напрямую.<br />
                    Нажми кнопку ниже, чтобы открыть в VLC/ffplay.
                  </div>
                ) : (
                  <div className="p-4 text-sm text-gray-500 text-center">Укажи URL потока, чтобы увидеть видео.</div>
                )}
              </div>

              {isAdmin && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      if (!cam.url) return;
                      navigator.clipboard?.writeText(cam.url);
                      showToast('Ссылка камеры скопирована', 'success');
                    }}
                    className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
                  >
                    Копировать URL
                  </button>
                  <button
                    onClick={() => {
                      if (!cam.url) return;
                      window.open(cam.url, '_blank');
                    }}
                    className="px-3 py-2 rounded-lg border border-indigo-300 text-indigo-700 hover:bg-indigo-50 text-sm"
                  >
                    Открыть поток
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isAdmin && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setCameraStreams((prev) => [...prev, { name: `Камера ${prev.length + 1}`, url: '' }].slice(0, 8))}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Добавить камеру
          </button>
          <button
            onClick={() => setCameraStreams([
              { name: 'Камера 1', url: 'https://cam.scladpro.ru/stream.html?src=cam161&mode=mse' },
              { name: 'Камера 2', url: 'https://cam.scladpro.ru/stream.html?src=cam120&mode=mse' },
              { name: 'Камера 3', url: 'https://cam.scladpro.ru/stream.html?src=cam239&mode=mse' },
              { name: 'Камера 176', url: 'https://cam.scladpro.ru/stream.html?src=cam176&mode=mse' },
              { name: 'Камера 160', url: 'https://cam.scladpro.ru/stream.html?src=cam160&mode=mse' },
            ])}
            className="px-4 py-2 rounded-lg border border-indigo-300 text-indigo-700 hover:bg-indigo-50"
          >
            Заполнить 5 камер (WebRTC)
          </button>
          <button
            onClick={() => window.open('http://10.241.166.161/doc/page/preview.asp', '_blank')}
            className="px-4 py-2 rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            Открыть web-preview (Windows)
          </button>
        </div>
      )}
    </div>
  );
}
