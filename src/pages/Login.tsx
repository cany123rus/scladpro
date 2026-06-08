import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { QrCode, User, Lock, Loader2, Camera, X, Eye, EyeOff, Delete, KeyRound } from 'lucide-react';
import jsQR from 'jsqr';
import { telegramService } from '../services/telegram.service';
import { storeCurrentEmployee } from '../utils/employeeStorage';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [mode, setMode] = useState<'password' | 'qr'>('password');
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [qrDebug, setQrDebug] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // ── PIN (быстрый вход) ───────────────────────────────────────────────
  const PIN_ENABLED = false; // вход по PIN отключён (всегда логин+пароль)
  const PIN_LEN = 6;
  const PIN_MAX_FAILS = 5;
  const PIN_FAIL_KEY = 'pin_fail_count';
  const getDeviceId = () => {
    let d = localStorage.getItem('employee_device_id') || '';
    if (!d) { d = `dev_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`; localStorage.setItem('employee_device_id', d); }
    return d;
  };
  const [pinProfiles, setPinProfiles] = useState<Array<{ employee_id: string; full_name: string; role: string; label: string | null }>>([]);
  const [showPinScreen, setShowPinScreen] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinVerifying, setPinVerifying] = useState(false);
  const [pinSetupEmployee, setPinSetupEmployee] = useState<any>(null);
  const [setupPin, setSetupPin] = useState('');
  const [setupPin2, setSetupPin2] = useState('');
  const [setupSaving, setSetupSaving] = useState(false);

  // Load PIN profiles registered on this device → show PIN screen by default.
  useEffect(() => {
    (async () => {
      if (!PIN_ENABLED) return; // PIN-вход отключён
      const params = new URLSearchParams(window.location.search);
      if (params.get('token') || params.get('t') || params.get('auth')) return; // token login takes over
      try {
        const { data } = await supabase.rpc('list_device_pin_profiles', { p_device_id: getDeviceId() });
        if (Array.isArray(data) && data.length) { setPinProfiles(data); setShowPinScreen(true); }
      } catch {}
    })();
  }, []);

  // After any successful authentication: store, report, and either prompt to set
  // a PIN on this device (first time) or go straight to the app.
  const afterAuth = async (employee: any, opts?: { skipPinPrompt?: boolean }) => {
    if (!employee) throw new Error('Сотрудник не найден');
    if (await isEmployeeBlocked(String(employee.id))) throw new Error('Сотрудник заблокирован');
    storeCurrentEmployee(employee);
    void sendLoginReport(employee);
    localStorage.removeItem(PIN_FAIL_KEY);
    const hasPin = pinProfiles.some((p) => String(p.employee_id) === String(employee.id));
    if (PIN_ENABLED && !opts?.skipPinPrompt && !hasPin) {
      setPinSetupEmployee(employee);
      setSetupPin(''); setSetupPin2('');
      return; // defer navigation until the user sets or skips the PIN
    }
    navigate('/');
  };

  const verifyPin = async (code: string) => {
    setPinVerifying(true); setPinError(null);
    try {
      const d = getDeviceId();
      const { data } = await supabase.rpc('verify_employee_pin', { p_device_id: d, p_pin: code });
      if (data) { await afterAuth(data, { skipPinPrompt: true }); return; }
      const n = Number(localStorage.getItem(PIN_FAIL_KEY) || '0') + 1;
      localStorage.setItem(PIN_FAIL_KEY, String(n));
      if (n >= PIN_MAX_FAILS) {
        try { await supabase.rpc('clear_device_pins', { p_device_id: d }); } catch {}
        localStorage.removeItem(PIN_FAIL_KEY);
        setPinProfiles([]); setShowPinScreen(false);
        setError('Слишком много неверных попыток. Войдите логином и паролем.');
      } else {
        setPinError(`Неверный PIN. Осталось попыток: ${PIN_MAX_FAILS - n}`);
      }
      setPin('');
    } catch (e: any) {
      setPinError('Ошибка проверки PIN'); setPin('');
    } finally {
      setPinVerifying(false);
    }
  };

  // auto-verify when 6 digits entered
  useEffect(() => {
    if (showPinScreen && pin.length === PIN_LEN && !pinVerifying) { void verifyPin(pin); }
  }, [pin, showPinScreen]);

  // Physical keyboard support (desktop / hardware) for PIN entry & setup.
  useEffect(() => {
    if (!showPinScreen && !pinSetupEmployee) return;
    const onKey = (e: KeyboardEvent) => {
      const isDigit = /^[0-9]$/.test(e.key);
      const isBack = e.key === 'Backspace';
      if (!isDigit && !isBack) return;
      e.preventDefault();
      setPinError(null);
      if (pinSetupEmployee) {
        if (setupPin.length < PIN_LEN) {
          if (isBack) setSetupPin((p) => p.slice(0, -1));
          else setSetupPin((p) => (p.length < PIN_LEN ? p + e.key : p));
        } else {
          if (isBack) setSetupPin2((p) => p.slice(0, -1));
          else setSetupPin2((p) => {
            const next = p.length < PIN_LEN ? p + e.key : p;
            if (next.length === PIN_LEN) setTimeout(() => saveSetupPinWith(next), 50);
            return next;
          });
        }
        return;
      }
      // verify screen
      if (pinVerifying) return;
      if (isBack) setPin((p) => p.slice(0, -1));
      else setPin((p) => (p.length < PIN_LEN ? p + e.key : p));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showPinScreen, pinSetupEmployee, setupPin, pinVerifying]);

  const saveSetupPinWith = async (confirmCode: string) => {
    if (!/^[0-9]{6}$/.test(setupPin)) { setPinError('PIN должен быть из 6 цифр'); return; }
    if (setupPin !== confirmCode) { setPinError('PIN-коды не совпадают'); setSetupPin2(''); return; }
    setSetupSaving(true); setPinError(null);
    const { error } = await supabase.rpc('set_employee_pin', { p_employee_id: pinSetupEmployee.id, p_device_id: getDeviceId(), p_pin: setupPin, p_label: pinSetupEmployee.full_name || null });
    setSetupSaving(false);
    if (error) {
      setPinError('Не удалось сохранить PIN: ' + (error.message || 'ошибка'));
      setSetupPin(''); setSetupPin2('');
      return;
    }
    setPinSetupEmployee(null);
    navigate('/');
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rawToken = params.get('token') || params.get('t') || params.get('auth');
    const token = rawToken ? decodeURIComponent(rawToken).trim() : '';

    if (!token) return;

    setLoading(true);
    supabase
      .from('employees')
      .select('*')
      .is('deleted_at', null)
      .eq('auth_token', token)
      .maybeSingle()
      .then(async ({ data: employee, error }) => {
        if (employee && !error) {
          if (await isEmployeeBlocked(String(employee.id))) {
            setError('Сотрудник заблокирован');
            setLoading(false);
            return;
          }
          storeCurrentEmployee(employee);
          void sendLoginReport(employee);

          // Clean URL from token after successful login
          window.history.replaceState({}, document.title, window.location.pathname);
          navigate('/');
          return;
        }

        setError('Неверная или устаревшая ссылка для входа');
        setLoading(false);
      })
      .catch(() => {
        setError('Ошибка проверки ссылки для входа');
        setLoading(false);
      });
  }, []);

  // Auto-detect QR code in email field (if scanner types there)
  useEffect(() => {
      if (/^(employee:|login:|auth:)/i.test(email.trim())) {
          processQrLogin(email);
          setEmail('');
      }
  }, [email]);

  const isScanningRef = useRef(false);

  const [lastScanned, setLastScanned] = useState<string>('');

  useEffect(() => {
    isScanningRef.current = scanning;
  }, [scanning]);

  // Helper to fix Russian keyboard layout
  const fixKeyboardLayout = (str: string) => {
      const replacer: Record<string, string> = {
          'й': 'q', 'ц': 'w', 'у': 'e', 'к': 'r', 'е': 't', 'н': 'y', 'г': 'u', 'ш': 'i', 'щ': 'o', 'з': 'p', 'х': '[', 'ъ': ']',
          'ф': 'a', 'ы': 's', 'в': 'd', 'а': 'f', 'п': 'g', 'р': 'h', 'о': 'j', 'л': 'k', 'д': 'l', 'ж': ';', 'э': "'",
          'я': 'z', 'ч': 'x', 'с': 'c', 'м': 'v', 'и': 'b', 'т': 'n', 'ь': 'm', 'б': ',', 'ю': '.', '.': '/'
      };
      
      return str.split('').map(char => {
          const lower = char.toLowerCase();
          if (replacer[lower]) {
              const replacement = replacer[lower];
              return char === lower ? replacement : replacement.toUpperCase();
          }
          // Handle special case for colon which might be mapped differently depending on shift
          if (char === 'Ж') return ':'; 
          if (char === 'ж') return ';';
          return char;
      }).join('');
  };

  // Hardware Scanner Focus Logic
  useEffect(() => {
    if (mode === 'qr' && !scanning) {
      const focusInput = (e?: Event) => {
        // If the click target is the camera button, don't focus
        if (e && e.target instanceof Element && e.target.closest('button[data-action="camera"]')) {
            return;
        }

        if (scannerInputRef.current) {
          scannerInputRef.current.focus({ preventScroll: true });
        }
      };
      
      focusInput();
      const interval = setInterval(focusInput, 1000); // Re-focus periodically
      window.addEventListener('click', focusInput);
      
      return () => {
        clearInterval(interval);
        window.removeEventListener('click', focusInput);
      };
    }
  }, [mode, scanning]);

  const handleHardwareChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Just to keep the input alive and debug
      setLastScanned(e.target.value);
  };

  const handleHardwareKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const rawCode = e.currentTarget.value;
      if (rawCode) {
        // Try raw code first, then fixed layout
        let codeToProcess = rawCode;
        
        // Check if it looks like Russian layout (contains Cyrillic)
        if (/[а-яА-Я]/.test(rawCode)) {
            const fixed = fixKeyboardLayout(rawCode);
            console.log('Fixed layout:', rawCode, '->', fixed);
            codeToProcess = fixed;
            setLastScanned(`${rawCode} -> ${fixed}`);
        } else {
            setLastScanned(rawCode);
        }

        processQrLogin(codeToProcess);
        e.currentTarget.value = ''; // Clear input
      }
    }
  };

  const isEmployeeBlocked = async (employeeId: string) => {
    try {
      const { data } = await supabase.from('app_settings').select('value').eq('key', 'blocked_employees_v1').maybeSingle();
      let list: string[] = [];
      try { list = data?.value ? JSON.parse(String(data.value)) : []; } catch {}
      return Array.isArray(list) && list.includes(String(employeeId));
    } catch {
      return false;
    }
  };

  const sendLoginReport = async (employee: any) => {
    try {
        let ip = 'Unknown';
        try {
            const ipRes = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipRes.json();
            ip = ipData.ip;
        } catch (e) { console.error('IP fetch failed', e); }

        const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        let deviceId = localStorage.getItem('employee_device_id') || '';
        if (!deviceId) {
          deviceId = `dev_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
          localStorage.setItem('employee_device_id', deviceId);
        }
        localStorage.setItem('employee_session_id', sessionId);

        // Log to database
        await supabase.from('activity_logs').insert([{
            employee_id: employee.id,
            action: 'Вход в систему',
            details: JSON.stringify({ kind: 'login_device', session_id: sessionId, device_id: deviceId, ip, platform: navigator.platform, browser: navigator.userAgent }),
            created_at: new Date().toISOString()
        }]);

        const browser = navigator.userAgent;
        const platform = navigator.platform;
        const time = new Date().toLocaleString('ru-RU');

        const text = `🟢 *Вход в систему*\n` +
                     `👤 **Сотрудник**: ${employee.full_name} (${employee.role})\n` +
                     `🕒 **Время**: ${time}\n` +
                     `🌐 **IP**: ${ip}\n` +
                     `💻 **Устройство**: ${platform}\n` +
                     `🌍 **Браузер**: ${browser}`;

        const { data: telegramSettings } = await supabase
            .from('app_settings')
            .select('key, value')
            .eq('key', 'telegram_login_logs_bot_token')
            .maybeSingle();
        const token = String(telegramSettings?.value || '').trim();
        if (token) {
            await telegramService.sendMessage(token, '498924112', text, 'Markdown');
        }

        await supabase.from('employees').update({ is_online: true }).eq('id', employee.id);
    } catch (e) {
        console.error('Login report failed', e);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const normalizedEmail = email.trim();
    const normalizedPassword = password.trim();

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: normalizedPassword,
      });

      if (error) {
        // Try Employee Login via secure RPC (password verified server-side, hash never leaves DB)
        const { data: employee, error: empError } = await supabase
          .rpc('verify_employee_login', { p_login: normalizedEmail, p_password: normalizedPassword });

        if (empError || !employee) {
          console.error('Employee fallback login failed:', { authError: error, empError, login: normalizedEmail });
          throw error; // Throw original auth error if employee not found
        }

        // Employee found
        await afterAuth(employee);
        return;
      }

      navigate('/');
    } catch (err: any) {
      const msg = String(err?.message || '').toLowerCase();
      setError(msg.includes('заблокирован') ? 'Сотрудник заблокирован' : 'Неверные учетные данные');
    } finally {
      setLoading(false);
    }
  };

  const completeEmployeeLogin = async (employee: any) => {
    await afterAuth(employee);
  };

  const processQrLogin = async (rawCode: string) => {
    if (!rawCode) return;

    const normalized = decodeURIComponent(String(rawCode).trim())
      .replace(/[\r\n\t]+/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    // Support full login links in QR: https://.../login?token=...
    let payload = normalized;
    try {
      if (/^https?:\/\//i.test(normalized)) {
        const u = new URL(normalized);
        const linkToken = u.searchParams.get('token') || u.searchParams.get('t') || u.searchParams.get('auth');
        if (linkToken) payload = `AUTH:${linkToken}`;
      }
    } catch {}

    const codeUpper = payload.toUpperCase();

    if (codeUpper.startsWith('AUTH:')) setQrDebug('QR тип: AUTH (токен)');
    else if (codeUpper.startsWith('LOGIN:')) setQrDebug('QR тип: LOGIN (логин:пароль)');
    else if (codeUpper.startsWith('EMPLOYEE:')) setQrDebug('QR тип: EMPLOYEE (ID сотрудника)');
    else if (/^https?:\/\//i.test(normalized)) setQrDebug('QR тип: LINK');
    else setQrDebug('QR тип: UNKNOWN');

    setLoading(true);
    setError(null);

    try {
      // AUTH:<token> (permanent token QR)
      if (codeUpper.startsWith('AUTH:')) {
        const token = payload.slice(payload.indexOf(':') + 1).trim();
        if (!token) throw new Error('Пустой токен QR');

        const { data: employee, error: empError } = await supabase
          .from('employees')
          .select('*')
          .is('deleted_at', null)
          .eq('auth_token', token)
          .maybeSingle();

        if (empError || !employee) {
          throw new Error('Сотрудник не найден по QR токену');
        }

        await completeEmployeeLogin(employee);
        return;
      }

      // LOGIN:<login>:<password>
      if (codeUpper.startsWith('LOGIN:')) {
        const loginPayload = payload.slice(payload.indexOf(':') + 1);
        const splitIndex = loginPayload.indexOf(':');
        if (splitIndex > 0) {
          const login = loginPayload.slice(0, splitIndex).trim();
          const pass = loginPayload.slice(splitIndex + 1).trim();

          const { data: employee, error: empError } = await supabase
            .rpc('verify_employee_login', { p_login: login, p_password: pass });

          if (empError || !employee) {
            throw new Error('Сотрудник не найден или неверный пароль');
          }

          await completeEmployeeLogin(employee);
          return;
        }
      }

      // EMPLOYEE:<uuid>
      if (codeUpper.startsWith('EMPLOYEE:')) {
          const employeeId = normalized.slice(normalized.indexOf(':') + 1).trim();

          const { data: employee, error: empError } = await supabase
            .from('employees')
            .select('*')
            .is('deleted_at', null)
            .eq('id', employeeId)
            .maybeSingle();

          if (empError || !employee) {
            throw new Error('Сотрудник не найден');
          }

          await completeEmployeeLogin(employee);
          return;
      }

      // Check if it's an admin QR (from profiles table)
      // Try exact match first
      let { data: profile, error } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('qr_code', normalized)
        .maybeSingle();

      // If not found, try case-insensitive match
      if (!profile) {
          // Try lowercase
           const { data: profileLower } = await supabase
            .from('profiles')
            .select('id, username')
            .eq('qr_code', normalized.toLowerCase())
            .maybeSingle();
            
           if (profileLower) profile = profileLower;
           
           // Try uppercase if still not found
           if (!profile) {
               const { data: profileUpper } = await supabase
                .from('profiles')
                .select('id, username')
                .eq('qr_code', normalized.toUpperCase())
                .maybeSingle();
                if (profileUpper) profile = profileUpper;
           }
      }

      if (!profile) {
        throw new Error(`Неверный QR-код (${normalized})`);
      }

      // Admin/profile QR codes must authenticate against Supabase Auth without any
      // hardcoded credentials. The QR payload is expected to carry an auth token
      // (AUTH:<token>) handled above; bare profile QR codes are no longer accepted.
      throw new Error('Этот QR-код больше не поддерживается. Используйте персональный QR сотрудника (AUTH-токен).');
    } catch (err: any) {
      setError(err.message);
      setQrDebug((prev) => `${prev}${prev ? ' • ' : ''}Ошибка: ${String(err?.message || 'неизвестно')}`);
      // Resume scanning after error
      setTimeout(() => {
          if (scanning) setScanning(true);
          setQrCode('');
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  // QR Scanner Logic (Camera)
  useEffect(() => {
    let animationFrameId: number;
    
    if (scanning) {
      (async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
          });
          streamRef.current = stream;
          
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.setAttribute('playsinline', 'true'); // required for iOS
            
            await videoRef.current.play().catch(e => console.error("Video play error:", e));
            
            const scan = () => {
              if (!scanning || !videoRef.current || !canvasRef.current) return;
              
              const video = videoRef.current;
              const canvas = canvasRef.current;
              
              if (video.readyState === video.HAVE_ENOUGH_DATA) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                
                if (ctx) {
                  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                  
                  const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                  });

                  if (code) {
                    setQrCode(code.data);
                    setScanning(false);
                    if (navigator.vibrate) navigator.vibrate(200);
                    processQrLogin(code.data);
                    return;
                  }
                }
              }
              animationFrameId = requestAnimationFrame(scan);
            };
            
            scan();
          }
        } catch (err) {
          console.error(err);
          setError('Не удалось получить доступ к камере. Проверьте разрешения.');
          setScanning(false);
        }
      })();
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [scanning]);

  const renderKeypad = (onDigit: (d: string) => void, onBack: () => void) => (
    <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto w-full">
      {['1','2','3','4','5','6','7','8','9'].map((d) => (
        <button key={d} type="button" onClick={() => onDigit(d)} className="h-16 rounded-2xl bg-slate-100 text-2xl font-semibold text-slate-800 active:bg-slate-200 hover:bg-slate-150 transition-colors">{d}</button>
      ))}
      <span />
      <button type="button" onClick={() => onDigit('0')} className="h-16 rounded-2xl bg-slate-100 text-2xl font-semibold text-slate-800 active:bg-slate-200 transition-colors">0</button>
      <button type="button" onClick={onBack} className="h-16 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"><Delete className="h-6 w-6" /></button>
    </div>
  );

  const renderDots = (len: number) => (
    <div className="flex items-center justify-center gap-3 my-6">
      {Array.from({ length: PIN_LEN }).map((_, i) => (
        <span key={i} className={`h-3.5 w-3.5 rounded-full transition-colors ${i < len ? 'bg-indigo-600' : 'bg-slate-200'}`} />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 w-full max-w-md relative">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4 overflow-hidden">
             <img src="/site-icon.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">СкладПро</h1>
          <p className="text-slate-500">Вход в систему</p>
        </div>

        {showPinScreen ? (
          <div className="space-y-2">
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 mb-2"><KeyRound className="h-6 w-6" /></div>
              <div className="text-lg font-semibold text-slate-900">Быстрый вход</div>
              <div className="text-sm text-slate-500">Введите PIN-код</div>
              {pinProfiles.length > 0 && (
                <div className="text-xs text-slate-400 mt-1 truncate">{pinProfiles.map((p) => p.full_name).filter(Boolean).join(' · ')}</div>
              )}
            </div>
            {renderDots(pin.length)}
            {pinError && <div className="text-center text-sm text-red-600 mb-2">{pinError}</div>}
            {pinVerifying ? (
              <div className="flex justify-center py-4"><Loader2 className="animate-spin h-6 w-6 text-indigo-600" /></div>
            ) : (
              renderKeypad(
                (d) => { setPinError(null); setPin((prev) => (prev.length < PIN_LEN ? prev + d : prev)); },
                () => { setPinError(null); setPin((prev) => prev.slice(0, -1)); }
              )
            )}
            <button
              type="button"
              onClick={() => { setShowPinScreen(false); setPin(''); setPinError(null); }}
              className="w-full mt-4 text-sm text-slate-500 hover:text-slate-700 py-2"
            >
              Войти логином и паролем
            </button>
          </div>
        ) : (
        <>
        <div className="bg-slate-100 p-1 rounded-xl flex mb-8">
          <button
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              mode === 'password'
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setMode('password')}
          >
            <div className="flex items-center justify-center gap-2">
              <Lock className="h-4 w-4" />
              Пароль
            </div>
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              mode === 'qr' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setMode('qr')}
          >
            <div className="flex items-center justify-center gap-2">
              <QrCode className="h-4 w-4" />
              QR Код
            </div>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-6 text-sm flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
            {error}
          </div>
        )}

        {mode === 'password' ? (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Логин</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="Введите логин или email"
                  autoComplete="username"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Пароль</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 pr-10 w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="Введите пароль"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3.5 rounded-xl hover:bg-indigo-700 transition-colors flex justify-center items-center font-medium shadow-lg shadow-indigo-200"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Войти'}
            </button>

            <button
              type="button"
              onClick={() => setMode('qr')}
              className="w-full bg-white text-indigo-600 border-2 border-indigo-100 py-3.5 rounded-xl hover:bg-indigo-50 transition-colors flex justify-center items-center gap-2 font-medium"
            >
              <QrCode className="h-5 w-5" />
              Сканировать QR-код
            </button>
          </form>
        ) : (
          <div className="space-y-5 relative">
            {/* Hidden Input for Hardware Scanner */}
            <input
              ref={scannerInputRef}
              type="text"
              className="opacity-0 absolute inset-0 w-full h-full cursor-default -z-10"
              autoFocus
              onChange={handleHardwareChange}
              onKeyDown={handleHardwareKeyDown}
              autoComplete="off"
            />

            <div className="text-center text-slate-500 text-sm mb-4">
              Сканируйте QR-код сканером или нажмите кнопку для использования камеры
              {lastScanned && <div className="mt-2 text-xs text-slate-400 font-mono">Скан: {lastScanned}</div>}
              {qrDebug && <div className="mt-2 text-xs text-indigo-500 font-medium">{qrDebug}</div>}
            </div>
            
            <button
              type="button"
              data-action="camera"
              onClick={() => setScanning(true)}
              className="w-full bg-indigo-600 text-white py-3.5 rounded-xl hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2 font-medium shadow-lg shadow-indigo-200"
            >
              <Camera className="h-5 w-5" />
              Сканировать камерой
            </button>
          </div>
        )}
        </>
        )}
      </div>

      {/* Set-PIN prompt after a full login */}
      {pinSetupEmployee && (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="text-center mb-2">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 mb-2"><KeyRound className="h-6 w-6" /></div>
              <div className="text-lg font-semibold text-slate-900">Быстрый вход по PIN</div>
              <div className="text-sm text-slate-500">{setupPin.length < PIN_LEN ? 'Придумайте PIN из 6 цифр' : 'Повторите PIN для подтверждения'}</div>
              <div className="text-xs text-slate-400 mt-1">{pinSetupEmployee.full_name}</div>
            </div>
            {renderDots(setupPin.length < PIN_LEN ? setupPin.length : setupPin2.length)}
            {pinError && <div className="text-center text-sm text-red-600 mb-2">{pinError}</div>}
            {setupSaving ? (
              <div className="flex justify-center py-4"><Loader2 className="animate-spin h-6 w-6 text-indigo-600" /></div>
            ) : setupPin.length < PIN_LEN ? (
              renderKeypad(
                (d) => { setPinError(null); setSetupPin((p) => (p.length < PIN_LEN ? p + d : p)); },
                () => setSetupPin((p) => p.slice(0, -1))
              )
            ) : (
              renderKeypad(
                (d) => {
                  setPinError(null);
                  setSetupPin2((p) => {
                    const next = p.length < PIN_LEN ? p + d : p;
                    if (next.length === PIN_LEN) setTimeout(() => saveSetupPinWith(next), 50);
                    return next;
                  });
                },
                () => setSetupPin2((p) => p.slice(0, -1))
              )
            )}
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={() => { setPinSetupEmployee(null); navigate('/'); }} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium">Пропустить</button>
              {setupPin.length === PIN_LEN && (
                <button type="button" onClick={() => { setSetupPin(''); setSetupPin2(''); setPinError(null); }} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium">Сбросить</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scanner Modal */}
      {scanning && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl overflow-hidden max-w-lg w-full relative shadow-2xl">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-medium">Сканирование QR-кода</h3>
              <button onClick={() => setScanning(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="relative bg-black aspect-square sm:aspect-video">
              <video 
                ref={videoRef} 
                className="w-full h-full object-cover" 
                playsInline 
                muted 
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 border-2 border-indigo-500 opacity-50 pointer-events-none m-12 rounded-2xl">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-indigo-500 -mt-1 -ml-1"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-indigo-500 -mt-1 -mr-1"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-indigo-500 -mb-1 -ml-1"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-indigo-500 -mb-1 -mr-1"></div>
              </div>
              <div className="absolute bottom-4 left-0 right-0 text-center text-white/80 text-sm">
                Наведите камеру на QR-код
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}