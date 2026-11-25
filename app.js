/* Milo Abfahrtskontrolle – App */
{
  /* ---------- Grundlagen ---------- */
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const CFG = window.MAK || {};
  let TZ = 'Europe/Berlin';
  try { if (CFG.tz) { new Intl.DateTimeFormat('de-DE', { timeZone: CFG.tz }); TZ = CFG.tz; } } catch (e) { }
  const fDatum = ts => new Date(ts).toLocaleDateString('de-DE', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric' });
  const fZeit = ts => new Date(ts).toLocaleTimeString('de-DE', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
  const fKm = n => Number(n || 0).toLocaleString('de-DE');
  const tag = ts => new Date(ts).toLocaleDateString('sv-SE', { timeZone: TZ });
  const normKz = v => String(v || '').toUpperCase().replace(/\s+/g, ' ').replace(/\s*-\s*/g, '-').trim();
  const KZ_OK = /^[A-ZÄÖÜ0-9][A-ZÄÖÜ0-9 \-]{1,14}$/;
  const plural = (n, a, b) => n + ' ' + (n === 1 ? a : b);
  const ls = {
    get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } },
    del: k => { try { localStorage.removeItem(k); } catch (e) { } }
  };
  /* Liegt die App bei GitHub, kommen die Daten von der Webseite (WordPress). SERVER merkt sich, unter welcher Adresse sie antwortet. */
  if (!CFG.app) { try { CFG.app = new URL('./', location.href).href; } catch (e) { CFG.app = String(location.href).split(/[?#]/)[0]; } }
  const SERVER = (() => {
    const liste = [CFG.ajax].concat(Array.isArray(CFG.ajaxAlt) ? CFG.ajaxAlt : []).filter(Boolean);
    let i = liste.indexOf(ls.get('mak_server') || ''), bekannt = i >= 0;      /* gemerkt wird die Adresse selbst – die Liste darf sich später ändern */
    if (i < 0) i = 0;
    return { url: () => liste[i] || CFG.ajax, alle: () => liste, nimm: n => { i = n; bekannt = true; ls.set('mak_server', liste[n]); }, gefunden: () => bekannt };
  })();
  /* Aufruf der Webseite: immer als einfaches Formular, ohne Cookies. Bei GitHub darf nichts dazukommen, was der Browser erst erfragen müsste. */
  const NETZ = CFG.extern ? { credentials: 'omit' } : { credentials: 'same-origin', cache: 'no-store' };
  const post = (url, body, mehr) => fetch(url, Object.assign({ method: 'POST', body }, NETZ, mehr || {}));
  const netzFehler = e => /^Keine Verbindung/.test(fehlerText(e));
  const fehlerText = e => String((e && e.message) || e || 'Unbekannter Fehler').replace(/^(Error|Exception):\s*/, '');
  const RUHIG = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* Symbole: Strichzeichnungen, 24er-Raster */
  const ZEICHEN = {
    ok: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    minus: '<path d="M6 12h12"/>',
    warn: '<path d="M12 8v5.5"/><circle cx="12" cy="17" r=".7" fill="currentColor"/><path d="M10.3 3.9 2.6 17.4a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
    links: '<path d="M15 5l-7 7 7 7"/>',
    rechts: '<path d="M9 5l7 7-7 7"/>',
    halt: '<circle cx="12" cy="8.8" r="6.3"/><path d="M9.8 6v5.6M14.2 6v5.6M9.8 8.8h4.4M12 15.1V22"/>',
    verlauf: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    pruefen: '<rect x="5" y="4" width="14" height="17" rx="2.5"/><path d="M9 4h6v2.6H9z"/><path d="M8.8 13.4l2.2 2.2 4.2-4.6"/>',
    ausweis: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><circle cx="8.5" cy="11" r="2.2"/><path d="M5.5 16c.6-1.6 1.7-2.4 3-2.4s2.4.8 3 2.4M14.5 9.5h4M14.5 13h4"/>',
    person: '<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20c1.2-3.6 4-5.4 7.5-5.4s6.3 1.8 7.5 5.4"/>',
    raster: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
    bus: '<rect x="4" y="3.5" width="16" height="14" rx="3"/><path d="M4 11h16M7.5 17.5V20M16.5 17.5V20"/><circle cx="8" cy="14.2" r=".7" fill="currentColor"/><circle cx="16" cy="14.2" r=".7" fill="currentColor"/>',
    fahrer: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3 19.5c.9-3 3.2-4.6 6-4.6s5.1 1.6 6 4.6"/><path d="M15.5 5.6a3.2 3.2 0 0 1 0 5.8M17.5 15.2c1.8.6 3 2 3.6 4.3"/>',
    kamera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>',
    wechsel: '<path d="M20 11a8 8 0 0 0-14.3-4.9L4 8"/><path d="M4 3v5h5"/><path d="M4 13a8 8 0 0 0 14.3 4.9L20 16"/><path d="M20 21v-5h-5"/>',
    ton: '<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
    ziel: '<path d="M5.5 21V4M5.5 4.5h11.5l-2.2 3.7 2.2 3.8H5.5"/>',
    aussen: '<rect x="2.5" y="5.5" width="19" height="10.5" rx="2.5"/><path d="M2.5 10.5h19M17 5.5v5"/><circle cx="7" cy="17.3" r="1.9"/><circle cx="17" cy="17.3" r="1.9"/>',
    motor: '<path d="M12 3.5c3 3.6 5.5 6.6 5.5 9.9a5.5 5.5 0 0 1-11 0c0-3.3 2.5-6.3 5.5-9.9z"/><path d="M9.5 14a2.6 2.6 0 0 0 2.5 2.4"/>',
    lenkrad: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.2"/><path d="M3.8 10.6c2.5-.9 5.2-1.4 8.2-1.4s5.7.5 8.2 1.4M12 14.2v6.2"/>',
    tuer: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M12 3v18M8.5 8v4M15.5 8v4"/>',
    schutz: '<path d="M12 3l7.5 3v5.4c0 4.5-3 7.9-7.5 9.6-4.5-1.7-7.5-5.1-7.5-9.6V6z"/><path d="M12 8.5v6M9 11.5h6"/>',
    papier: '<path d="M7 3h7l4.5 4.5V19a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M14 3v4.5h4.5M8.5 12.5h7M8.5 16h5"/>',
    liste: '<rect x="5" y="4" width="14" height="17" rx="2.5"/><path d="M9 4h6v2.6H9zM8.5 12h7M8.5 15.5h5"/>'
  };
  const ic = (name, g, sw) => `<svg width="${g || 24}" height="${g || 24}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw || 2}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ZEICHEN[name] || ''}</svg>`;
  const IC = {
    ok: ic('ok', 38, 2.6),
    warn: ic('warn', 38, 2.2),
    leer: '<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M9 3.5h6v2.5H9zM8.5 11h7M8.5 14.5h5"/></svg>',
    kamera: ic('kamera', 20),
    play: '<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="rgba(0,0,0,.55)"/><path d="M10 8l6 4-6 4z" fill="#fff"/></svg>',
    wechsel: ic('wechsel', 26),
    ausweis: '<svg width="46" height="34" viewBox="0 0 46 34" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2" y="2" width="42" height="30" rx="4"/><circle cx="14" cy="15" r="5"/><path d="M6 27c1.5-4 4.5-6 8-6s6.5 2 8 6M27 11h12M27 17h12M27 23h8"/></svg>'
  };
  function bereichIcon(name) {
    const n = String(name).toLowerCase();
    const z = /außen|aussen|rundgang|karosser/.test(n) ? 'aussen' : /motor|füllst|fuellst|öl/.test(n) ? 'motor' : /fahrerplatz|cockpit|fahrer/.test(n) ? 'lenkrad'
      : /fahrgast|tür|tuer|innen/.test(n) ? 'tuer' : /sicherheit|notfall|ausrüst/.test(n) ? 'schutz' : /papier|dokument|unterlagen/.test(n) ? 'papier' : 'liste';
    return ic(z, 26);
  }

  const ARTEN = { solobus: 'Solobus', gelenkbus: 'Gelenkbus', reisebus: 'Reisebus', auto: 'Auto' };
  const artName = a => ARTEN[a] || '';
  const ARTICON = {
    solobus: '<svg class="ai" viewBox="0 0 44 20" aria-hidden="true"><rect x="2" y="3" width="38" height="12" rx="2.5" fill="currentColor"/><rect x="6" y="5.5" width="26" height="4" rx="1" fill="var(--card)"/><rect x="34" y="5.5" width="4" height="7" rx="1" fill="var(--card)"/><circle cx="11" cy="16" r="2.8" fill="currentColor" stroke="var(--card)" stroke-width="1.4"/><circle cx="31" cy="16" r="2.8" fill="currentColor" stroke="var(--card)" stroke-width="1.4"/></svg>',
    gelenkbus: '<svg class="ai" viewBox="0 0 60 20" aria-hidden="true"><rect x="2" y="3" width="27" height="12" rx="2.5" fill="currentColor"/><rect x="31" y="3" width="27" height="12" rx="2.5" fill="currentColor"/><rect x="28" y="4.5" width="4" height="9" fill="currentColor" opacity=".55"/><rect x="5" y="5.5" width="21" height="4" rx="1" fill="var(--card)"/><rect x="34" y="5.5" width="15" height="4" rx="1" fill="var(--card)"/><rect x="52" y="5.5" width="4" height="7" rx="1" fill="var(--card)"/><circle cx="10" cy="16" r="2.8" fill="currentColor" stroke="var(--card)" stroke-width="1.4"/><circle cx="24" cy="16" r="2.8" fill="currentColor" stroke="var(--card)" stroke-width="1.4"/><circle cx="49" cy="16" r="2.8" fill="currentColor" stroke="var(--card)" stroke-width="1.4"/></svg>',
    reisebus: '<svg class="ai" viewBox="0 0 44 20" aria-hidden="true"><path d="M2 4a2 2 0 0 1 2-2h29c2.5 0 4 1.2 5 3.4l2 5.6V15H2z" fill="currentColor"/><rect x="5" y="4.5" width="27" height="4.5" rx="1" fill="var(--card)"/><path d="M34 4.5h1.6c.9 0 1.5.5 1.9 1.4l1.4 3.6H34z" fill="var(--card)"/><circle cx="10" cy="16" r="2.8" fill="currentColor" stroke="var(--card)" stroke-width="1.4"/><circle cx="31" cy="16" r="2.8" fill="currentColor" stroke="var(--card)" stroke-width="1.4"/></svg>',
    auto: '<svg class="ai" viewBox="0 0 44 20" aria-hidden="true"><path d="M5 14v-3.5c0-1 .6-1.8 1.6-2.1l5-1.4 4.2-3.4c.8-.6 1.7-.9 2.7-.9h8.6c1.1 0 2.1.5 2.8 1.3l3 3.4 4.4 1c1.1.3 1.7 1.2 1.7 2.3V14z" fill="currentColor"/><path d="M17 5.4c.4-.3.9-.5 1.5-.5H23v3.4h-9.3zM25 4.9h3.1c.6 0 1.1.3 1.5.7l2.3 2.7H25z" fill="var(--card)"/><circle cx="12" cy="15" r="3" fill="currentColor" stroke="var(--card)" stroke-width="1.4"/><circle cx="33" cy="15" r="3" fill="currentColor" stroke="var(--card)" stroke-width="1.4"/></svg>'
  };
  const kzHtml = (kz, gross) => `<span class="kz${gross ? ' gross' : ''}"><i aria-hidden="true">D</i><b>${esc(kz)}</b></span>`;
  const leer = t => `<div class="leer">${IC.leer}<p>${esc(t)}</p></div>`;

  /* Formulare werden per Skript abgeschickt – so klappt es auch in eingeschränkten Vorschau-Fenstern */
  const absenden = f => { if (f) f.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); };
  document.addEventListener('click', ev => { const b = ev.target.closest('[data-absenden]'); if (b && !b.disabled) absenden(b.closest('form')); });
  document.addEventListener('keydown', ev => {
    if (ev.key !== 'Enter' || ev.isComposing || !(ev.target instanceof HTMLInputElement)) return;
    const f = ev.target.form;
    if (f && f.querySelector('[data-absenden]')) { ev.preventDefault(); absenden(f); }
  });

  const S = { token: ls.get('mak_token'), ich: null, fz: [], modelle: [], cl: [], gruppen: [], einst: {}, meine: [], ad: null, adTage: 0, detail: null,
    fl: { tage: 7, fid: '', kz: '', art: '', nurM: false }, fs: null, fsListe: null, fsF: {}, push: '', maxUpload: 0, view: '', angekommen: false, flowFertig: false };
  let F = null;

  /* ---------- Töne und Vibration (im Gerät erzeugt, keine Tondateien) ---------- */
  const Ton = (() => {
    let ctx = null, aus = null;
    const istAn = () => ls.get('mak_ton') !== '0';
    const vibAn = () => ls.get('mak_vib') !== '0';
    const vibGeht = typeof navigator.vibrate === 'function';
    function wecken() {
      if (!istAn()) return null;
      try {
        if (!ctx) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return null;
          ctx = new AC();
          aus = ctx.createGain();
          aus.gain.value = 0.9;
          aus.connect(ctx.destination);
        }
        if (ctx.state !== 'running') { const p = ctx.resume(); if (p && p.catch) p.catch(() => { }); }
      } catch (e) { ctx = null; }
      return ctx;
    }
    /* Bausteine – c: Tonausgabe (auch zum Messen ohne Lautsprecher), z: Ziel, t: Startzeit, d: Dauer */
    function ton(c, z, f, t, d, o) {
      o = o || {};
      const os = c.createOscillator(), g = c.createGain();
      os.type = o.typ || 'sine';
      os.frequency.setValueAtTime(f, t);
      if (o.bis) os.frequency.exponentialRampToValueAtTime(o.bis, t + d);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(o.vol || 0.2, t + (o.an || 0.006));
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      os.connect(g); g.connect(z);
      os.start(t); os.stop(t + d + 0.03);
    }
    function glocke(c, z, f, t, d, vol) {
      ton(c, z, f, t, d, { vol });
      ton(c, z, f * 2, t, d * 0.6, { vol: vol * 0.35 });
      ton(c, z, f * 3.01, t, d * 0.35, { vol: vol * 0.15 });
    }
    function rauschen(c, z, t, d, o) {
      o = o || {};
      const n = Math.max(1, Math.floor(c.sampleRate * d)), buf = c.createBuffer(1, n, c.sampleRate), dat = buf.getChannelData(0);
      for (let i = 0; i < n; i++) dat[i] = Math.random() * 2 - 1;
      const q = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
      q.buffer = buf;
      fl.type = o.typ || 'bandpass';
      fl.Q.value = o.q || 0.7;
      fl.frequency.setValueAtTime(o.f0 || 3000, t);
      fl.frequency.exponentialRampToValueAtTime(o.f1 || o.f0 || 3000, t + d);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(o.vol || 0.15, t + (o.an || 0.02));
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      q.connect(fl); fl.connect(g); g.connect(z);
      q.start(t); q.stop(t + d + 0.03);
    }
    const LEITER = [1046.5, 1174.7, 1318.5, 1568, 1760];
    const KLANG = {
      tipp: (c, z, t) => ton(c, z, 420, t, 0.05, { typ: 'triangle', vol: 0.16, bis: 300 }),
      ok: (c, z, t, n) => glocke(c, z, LEITER[(n || 0) % LEITER.length], t, 0.22, 0.24),
      mangel: (c, z, t) => { ton(c, z, 392, t, 0.13, { typ: 'triangle', vol: 0.3 }); ton(c, z, 294, t + 0.12, 0.2, { typ: 'triangle', vol: 0.3 }); },
      na: (c, z, t) => ton(c, z, 520, t, 0.07, { typ: 'triangle', vol: 0.18 }),
      /* Haltewunsch-Gong: eine Haltestelle ist fertig */
      halt: (c, z, t) => glocke(c, z, 987.8, t, 0.9, 0.3),
      /* Abfahrt: Türwarnton, Türen zischen zu, dann der Gong */
      abfahrt: (c, z, t) => {
        [0, 0.13, 0.26].forEach(d => ton(c, z, 1900, t + d, 0.07, { typ: 'square', vol: 0.09 }));
        rauschen(c, z, t + 0.42, 0.7, { f0: 2600, f1: 500, vol: 0.2 });
        rauschen(c, z, t + 1.02, 0.09, { f0: 320, f1: 180, vol: 0.3, typ: 'lowpass' });
        glocke(c, z, 523.3, t + 1.75, 0.5, 0.26);
        glocke(c, z, 659.3, t + 1.93, 0.5, 0.26);
        glocke(c, z, 784, t + 2.11, 1.1, 0.3);
      },
      warnung: (c, z, t) => [0, 0.26, 0.52].forEach(d => ton(c, z, 880, t + d, 0.17, { typ: 'square', vol: 0.16 })),
      fehler: (c, z, t) => { ton(c, z, 233, t, 0.1, { typ: 'square', vol: 0.12 }); ton(c, z, 196, t + 0.11, 0.16, { typ: 'square', vol: 0.12 }); },
      kamera: (c, z, t) => { rauschen(c, z, t, 0.035, { f0: 5200, vol: 0.3, typ: 'highpass', an: 0.002 }); rauschen(c, z, t + 0.075, 0.06, { f0: 2400, f1: 1200, vol: 0.26, an: 0.002 }); },
      aufnahmeAn: (c, z, t) => ton(c, z, 660, t, 0.16, { vol: 0.22, bis: 990 }),
      aufnahmeAus: (c, z, t) => { ton(c, z, 880, t, 0.09, { vol: 0.22 }); ton(c, z, 660, t + 0.11, 0.14, { vol: 0.22 }); },
      willkommen: (c, z, t) => { glocke(c, z, 659.3, t, 0.35, 0.2); glocke(c, z, 987.8, t + 0.16, 0.7, 0.22); }
    };
    const RUCKELN = { ok: 12, mangel: [30, 50, 30], na: 8, halt: 25, abfahrt: [20, 110, 20, 110, 20, 500, 60], warnung: [180, 90, 180, 90, 180], fehler: [45, 40, 45], kamera: 15 };
    function spiel(name, n) {
      if (vibGeht && vibAn() && RUCKELN[name]) { try { navigator.vibrate(RUCKELN[name]); } catch (e) { } }
      const c = wecken();
      if (!c || !KLANG[name]) return;
      try { KLANG[name](c, aus, c.currentTime + 0.02, n); } catch (e) { }
    }
    /* Zum Prüfen ohne Lautsprecher: Klang in den Speicher rechnen und die Lautstärke messen */
    async function messen(name, sek) {
      const OC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      const c = new OC(1, Math.ceil(44100 * (sek || 3.5)), 44100);
      KLANG[name](c, c.destination, 0.02, 0);
      const d = (await c.startRendering()).getChannelData(0);
      let spitze = 0, summe = 0, ende = 0;
      for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > spitze) spitze = a; summe += a * a; if (a > 0.003) ende = i; }
      return { spitze, rms: Math.sqrt(summe / d.length), dauer: ende / 44100 };
    }
    return {
      spiel, wecken, messen, namen: () => Object.keys(KLANG), istAn, vibAn, vibGeht,
      setAn: v => ls.set('mak_ton', v ? '1' : '0'), setVib: v => ls.set('mak_vib', v ? '1' : '0'),
      stand: () => (ctx ? ctx.state : 'aus')
    };
  })();

  let toastT = 0;
  function toast(text, fehler) {
    const el = $('#toast');
    el.textContent = text;
    el.className = 'toast an' + (fehler ? ' fehler' : '');
    clearTimeout(toastT);
    toastT = setTimeout(() => { el.className = 'toast'; }, fehler ? 4500 : 2800);
    if (fehler) Ton.spiel('fehler');
  }
  function toastWeg() { clearTimeout(toastT); $('#toast').className = 'toast'; }

  /* Zurück-Taste (Android): schließt zuerst Kamera, Detailfenster oder die laufende Kontrolle, statt die App zu verlassen */
  const RUECK = !window.MAK_TEST && !!(window.history && history.pushState);
  let gehalten = false, popStill = false;
  function halten() {
    if (!RUECK || gehalten) return;
    try { history.pushState({ mak: 1 }, ''); gehalten = true; } catch (e) { }
  }
  function etwasOffen() { return !!($('.betrachter') || $('.kam') || !$('#modal').hidden || !$('#v-neu').hidden); }
  function loslassen() {
    if (!RUECK || !gehalten || etwasOffen()) return;
    gehalten = false; popStill = true;
    try { history.back(); } catch (e) { popStill = false; }
  }
  window.addEventListener('popstate', () => {
    if (popStill) { popStill = false; return; }
    if (!gehalten) return;
    gehalten = false;
    const b = $('.betrachter'), k = $('.kam');
    if (b) b.remove();
    else if (k) { const zu = $('[data-k="zu"]', k); if (zu) zu.click(); }
    else if (!$('#modal').hidden) modalZu();
    else if (!$('#v-neu').hidden) { if (!S.flowFertig && F && F.schritt > 0) zuSchritt(F.schritt - 1, -1); else flowZu(); }
    if (etwasOffen()) halten();
  });

  /* ---------- Server-Aufrufe ---------- */
  async function rpc(fn, args, token) {
    const body = new FormData();
    body.append('action', 'mak');
    body.append('fn', fn);
    body.append('token', token || '');
    body.append('args', JSON.stringify(args || []));
    let res, j = null;
    try { res = await post(SERVER.url(), body); }
    catch (e) { $('#offline').hidden = false; throw new Error('Keine Verbindung. Bitte Internet prüfen und erneut versuchen.'); }
    $('#offline').hidden = true;
    try { j = await res.json(); } catch (e) { }
    if (!j || typeof j !== 'object') throw new Error('Der Server antwortet nicht richtig (' + res.status + '). Ist das Plugin aktiviert?');
    if (!j.ok) throw new Error(j.fehler || 'Unbekannter Fehler');
    return j.daten;
  }
  async function api(fn, ...args) {
    if (!S.token) await login(false);
    try { return await rpc(fn, args, S.token); }
    catch (e) {
      if (fehlerText(e) !== 'SITZUNG') throw e;
      await login(true);
      return rpc(fn, args, S.token);
    }
  }

  /* ---------- App bei GitHub: Webseite finden, Name und Farben von dort übernehmen ---------- */
  function konfigAnwenden(k) {
    if (!k || typeof k !== 'object') return;
    const f = k.farben;
    if (f && typeof f === 'object') {
      Object.keys(f).forEach(n => { if (/^[a-z-]{1,8}$/.test(n) && /^#[0-9a-f]{6}$/i.test(f[n])) document.documentElement.style.setProperty('--' + n, f[n]); });
      const m = $('meta[name="theme-color"]');
      if (m && /^#[0-9a-f]{6}$/i.test(f.bnd || '')) m.content = f.bnd;
    }
    if (k.firma) { CFG.firma = String(k.firma); if (!S.ich) $('#firma').textContent = CFG.firma; }
    if (k.tz) { try { new Intl.DateTimeFormat('de-DE', { timeZone: k.tz }); TZ = k.tz; } catch (e) { } }
    if (k.version) CFG.plugin = String(k.version);
  }
  async function konfigHolen(url) {
    const body = new FormData();
    body.append('action', 'mak'); body.append('fn', 'konfig'); body.append('args', '[]');
    const ab = 'AbortController' in window ? new AbortController() : null;
    const uhr = setTimeout(() => { if (ab) ab.abort(); }, 9000);
    try {
      const j = await (await post(url, body, ab ? { signal: ab.signal } : null)).json();
      if (!j || !j.ok || !j.daten || j.daten.app !== 'milo-abfahrtskontrolle') throw new Error('Plugin fehlt');
      return j.daten;
    } finally { clearTimeout(uhr); }
  }
  let serverDa = true, konfigBereit = Promise.resolve(true);
  async function serverFinden() {
    const liste = SERVER.alle(), start = Math.max(0, liste.indexOf(SERVER.url()));
    for (let n = 0; n < liste.length; n++) {
      const i = (start + n) % liste.length;
      try {
        const k = await konfigHolen(liste[i]);
        SERVER.nimm(i); ls.set('mak_konfig', JSON.stringify(k)); konfigAnwenden(k);
        serverDa = true;
        return true;
      } catch (e) { }
    }
    serverDa = false;
    return false;
  }
  const versionKleiner = (a, b) => { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) < (y[i] || 0); } return false; };

  /* ---------- Anmeldung ---------- */
  let loginFertig = null, startBis = 0;
  function login(wieder) {
    $('#login').hidden = false;
    const ohneServer = !!CFG.extern && !serverDa && navigator.onLine !== false;
    $('#lgHinweis').hidden = !(wieder && S.ich) && !ohneServer;
    $('#lgHinweis').textContent = wieder && S.ich ? 'Deine Anmeldung ist abgelaufen. Bitte PIN erneut eingeben – deine Eingaben bleiben erhalten.'
      : 'Die App erreicht die Webseite mit den Daten gerade nicht. Bitte später noch einmal versuchen. Für die Verwaltung: In WordPress muss das Plugin „Milo Abfahrtskontrolle“ ab Version ' + (CFG.braucht || '1.5.0') + ' aktiv sein.';
    $('#lgName').value = ls.get('mak_name') || '';
    $('#lgPin').value = '';
    $('#lgFehler').textContent = '';
    uhr();
    setTimeout(() => { try { ($('#lgName').value ? $('#lgPin') : $('#lgName')).focus(); } catch (e) { } }, Math.max(60, startBis - Date.now()));
    return new Promise(r => { loginFertig = r; });
  }
  $('#lgForm').addEventListener('submit', async ev => {
    ev.preventDefault();
    const btn = $('#lgBtn');
    btn.disabled = true; btn.textContent = 'Anmelden …';
    $('#lgFehler').textContent = '';
    Ton.wecken();
    try {
      if (CFG.extern && !serverDa) { konfigBereit = serverFinden(); if (await konfigBereit) $('#lgHinweis').hidden = true; }
      const r = await rpc('anmelden', [$('#lgName').value, $('#lgPin').value]);
      S.token = r.token;
      ls.set('mak_token', r.token); ls.set('mak_name', r.name);
      $('#login').hidden = true;
      Ton.spiel('willkommen');
      const f = loginFertig; loginFertig = null;
      if (f) f();
    } catch (e) { $('#lgFehler').textContent = fehlerText(e); Ton.spiel('fehler'); }
    btn.disabled = false; btn.textContent = 'Anmelden';
  });
  async function abmelden() {
    const t = S.token;
    S.token = null; S.ich = null; S.ad = null; S.adTage = 0; S.view = ''; S.angekommen = false; S.flowFertig = false; S.abLauf = null;
    ls.del('mak_token'); ls.del('mak_start');
    S.fsF = {}; S.fsNochmal = false;
    serverUrls.forEach(u => URL.revokeObjectURL(u)); serverUrls.clear();
    rpc('abmelden', [], t).catch(() => { });
    toastWeg();
    if (!$('#modal').hidden) modalZu();
    vNeu.hidden = true; vNeu.innerHTML = '';
    flowSperre(false);
    document.body.classList.remove('rolle-admin', 'rolle-fahrer');
    $('#wer').hidden = true; $('#tabs').hidden = true; $('#tabs').innerHTML = ''; $('#firma').textContent = CFG.firma || '';
    $$('main > section.view').forEach(s => { s.hidden = true; s.innerHTML = ''; });
    loslassen();
    await login(false);
    laden();
  }
  document.addEventListener('click', ev => { if (ev.target.closest('[data-abmelden]')) abmelden(); });

  /* ---------- Anzeigetafel ---------- */
  function tafelHtml(zeilen, kopf, klasse) {
    return `<div class="tafel${klasse ? ' ' + klasse : ''}"><div class="tf-kopf"><span>${esc(kopf)}</span><span class="tf-uhr" data-uhr></span></div>${zeilen.map(z => `<div class="tf-zeile${z[2] ? ' ' + z[2] : ''}"><span>${esc(z[0])}</span><span class="tf-wert">${esc(z[1])}</span></div>`).join('')}</div>`;
  }
  function uhr() {
    const t = fZeit(Date.now());
    $$('[data-uhr]').forEach(el => { if (el.dataset.t !== t) { el.dataset.t = t; el.innerHTML = esc(t).replace(':', '<i>:</i>'); } });
  }
  setInterval(uhr, 4000);

  /* ---------- Fahrzeuge und Haltestelle: Zeichnungen nach Bauform (Türen, Gelenk, Decks), keine Herstellerbilder ---------- */
  const zBogen = (x, y, r) => `<path d="M${x - r} ${y}a${r} ${r} 0 0 1 ${2 * r} 0z" class="z-kasten"/>`;
  const zRad = (x, y, r) => { const n = +(r * 0.56).toFixed(1); return `<g class="rad"><circle cx="${x}" cy="${y}" r="${r}" class="z-reifen"/><circle cx="${x}" cy="${y}" r="${n}" class="z-felge"/><path d="M${x - n} ${y}h${2 * n}M${x} ${y - n}v${2 * n}" class="z-speiche"/></g>`; };
  const zTuer = (x, y, w, h) => { const b = w / 2, o = (b * 0.82).toFixed(1); return `<rect x="${x}" y="${y}" width="${w}" height="${h}" class="z-innen"/><rect x="${x}" y="${y}" width="${b}" height="${h}" rx="1" class="z-fluegel fl-l" style="--o:${o}px"/><rect x="${x + b}" y="${y}" width="${b}" height="${h}" rx="1" class="z-fluegel fl-r" style="--o:${o}px"/>`; };
  const zFenster = (x, y, w, h, n) => { let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2.5" class="z-glas"/>`; for (let i = 1; i < n; i++) s += `<path d="M${+(x + w * i / n).toFixed(1)} ${y}v${h}" class="z-steg"/>`; return s; };
  const zZiel = (x, y, w) => `<rect x="${x}" y="${y}" width="${w}" height="3.8" rx="1" class="z-ziel"/><path d="M${x + 2.5} ${y + 1.9}h${w - 5}" class="z-zielt"/>`;
  const zLichter = (l, yb, yl) => `<rect x="${l - 4}" y="${yl}" width="4" height="4.5" rx="1" class="z-licht"/><rect x="${l - 3.6}" y="${yb}" width="3.6" height="3.6" rx="1" class="z-blink blink"/><rect x="0" y="${yb}" width="2.8" height="4" rx="1" class="z-blink blink"/><rect x="0" y="${yl - 1}" width="2.8" height="6" rx="1" class="z-rueck"/>`;
  /* Wagenkasten eines Stadtbusses von x0 bis x1; heck/front: abgerundetes Ende */
  function zStadtKar(x0, x1, heck, front) {
    const o = 8, u = 52;
    const rechts = `V${u - (front ? 4 : 0)}${front ? `Q${x1} ${u} ${x1 - 4} ${u}` : ''}H${x0 + (heck ? 4 : 0)}`;
    return `<path class="z-kar" d="M${x0 + (heck ? 5 : 0)} ${o}H${x1 - (front ? 9 : 0)}${front ? `Q${x1} ${o} ${x1} ${o + 10}` : ''}${rechts}${heck ? `Q${x0} ${u} ${x0} ${u - 4}V${o + 5}Q${x0} ${o} ${x0 + 5} ${o}` : `V${o}`}Z"/>`
      + `<path class="z-streif" d="M${x0} 41H${x1}${rechts}${heck ? `Q${x0} ${u} ${x0} ${u - 4}` : ''}Z"/>`;
  }
  function zGelenk(tuerenHinten, hybrid) {
    const vier = tuerenHinten.length > 1, radH = vier ? 60 : 40;
    let s = hybrid
      ? '<rect x="14" y="1" width="78" height="8" rx="3" class="z-dach"/><rect x="150" y="1" width="100" height="8" rx="3" class="z-dach"/>'
      : '<rect x="34" y="2.5" width="46" height="6.5" rx="2.5" class="z-dach"/><rect x="178" y="2.5" width="56" height="6.5" rx="2.5" class="z-dach"/>';
    s += '<rect x="118" y="10" width="18" height="40" class="z-balg"/><path d="M121.5 10v40M125 10v40M128.5 10v40M132 10v40" class="z-falte"/>';
    s += zStadtKar(0, 120, true, false) + zStadtKar(134, 300, false, true);
    s += vier ? zFenster(42, 15, 46, 18, 2) : zFenster(8, 15, 56, 18, 2) + zFenster(100, 15, 16, 18, 1);
    tuerenHinten.forEach(t => { s += zTuer(t[0], 15, t[1], 34); });
    s += zFenster(138, 15, 24, 18, 1) + zFenster(198, 15, 64, 18, 3) + '<path d="M291 15h4.5q3.5 0 3.5 3.5V33h-8z" class="z-glas"/>';
    s += zTuer(166, 15, 28, 34) + zTuer(266, 15, 22, 34) + zZiel(226, 10.4, 34);
    if (hybrid) s += '<path d="M2 41.6H118.5M135.5 41.6H298" class="z-oeko"/>';
    s += zBogen(radH, 52, 10) + zBogen(152, 52, 10) + zBogen(250, 52, 10) + zRad(radH, 52.5, 7.5) + zRad(152, 52.5, 7.5) + zRad(250, 52.5, 7.5);
    s += zLichter(300, 36, 43) + '<path d="M299.5 16.5h3.5v6" class="z-spiegel"/>';
    return { w: 304, l: 300, h: 60, svg: s };
  }
  const FZ = {
    solobus: () => ({ w: 204, l: 200, h: 60, svg:
      '<rect x="60" y="2.5" width="58" height="6.5" rx="2.5" class="z-dach"/>'
      + zStadtKar(0, 200, true, true)
      + zFenster(10, 15, 78, 18, 3) + zFenster(124, 15, 38, 18, 2)
      + '<path d="M191 15h4.5q3.5 0 3.5 3.5V33h-8z" class="z-glas"/>'
      + zTuer(92, 15, 28, 34) + zTuer(166, 15, 22, 34) + zZiel(128, 10.4, 30)
      + zBogen(52, 52, 10) + zBogen(150, 52, 10) + zRad(52, 52.5, 7.5) + zRad(150, 52.5, 7.5)
      + zLichter(200, 36, 43) + '<path d="M199.5 16.5h3.5v6" class="z-spiegel"/>' }),
    gelenkbus: () => zGelenk([[68, 28]], false),
    gelenkbus4: () => zGelenk([[14, 24], [92, 24]], false),
    hybridgelenk: () => zGelenk([[68, 28]], true),
    reisebus: () => ({ w: 222, l: 216, h: 66, svg:
      '<path class="z-kar" d="M6 2H184Q203 2 209 21L216 45V54Q216 58 212 58H4Q0 58 0 54V8Q0 2 6 2Z"/>'
      + '<path class="z-streif" d="M0 46H216V54Q216 58 212 58H4Q0 58 0 54Z"/>'
      + zFenster(8, 9, 168, 20, 6)
      + '<path d="M180 9h5.5q11.5 0 16.5 12l3.2 8H180z" class="z-glas"/>'
      + '<path d="M62 36.5H100M124 36.5H154M82 36.5V46M138 36.5V46" class="z-fuge"/>'
      + zTuer(104, 32, 16, 23) + zTuer(183, 32, 16, 23)
      + zBogen(46, 58, 10.5) + zBogen(166, 58, 10.5) + zRad(46, 58, 8) + zRad(166, 58, 8)
      + zLichter(216, 41.5, 48)
      + '<path d="M206 13q9 1 10 9" class="z-spiegel"/><rect x="213.6" y="21" width="4.6" height="9.5" rx="2" class="z-spiegelk"/>' }),
    doppeldecker: () => ({ w: 236, l: 230, h: 74, svg:
      '<path class="z-kar" d="M6 2H204Q221 2 225 19L230 49V62Q230 66 226 66H4Q0 66 0 62V8Q0 2 6 2Z"/>'
      + '<path class="z-streif" d="M0 54H230V62Q230 66 226 66H4Q0 66 0 62Z"/>'
      + zFenster(8, 8, 186, 17, 7)
      + '<path d="M198 8h7q12 0 15.4 12l1.4 5H198z" class="z-glas"/>'
      + '<path d="M1 29.5H227" class="z-fuge"/>'
      + zFenster(64, 34, 40, 15, 2) + zFenster(134, 34, 58, 15, 3)
      + '<path d="M218 34h7.6l2.4 15H218z" class="z-glas"/>'
      + zTuer(110, 34, 18, 29) + zTuer(198, 34, 16, 29)
      + zBogen(44, 66, 10.5) + zBogen(66, 66, 10.5) + zBogen(180, 66, 10.5) + zRad(44, 66, 8) + zRad(66, 66, 8) + zRad(180, 66, 8)
      + zLichter(230, 50, 57)
      + '<path d="M221 12q9 1 10 9" class="z-spiegel"/><rect x="228.6" y="20" width="4.6" height="9.5" rx="2" class="z-spiegelk"/>' }),
    auto: () => ({ w: 78, l: 74, h: 30, svg:
      '<path class="z-kar" d="M2 22V16q0-3 3-3.6l8-1.8 8.4-6.6Q24 2 27.4 2H44q3.6 0 6 2.6l6 6.6 12.6 2.4Q73 14.6 73 19v3q0 2-2 2H4q-2 0-2-2Z"/>'
      + '<path class="z-glas" d="M19 11.4 25.6 6q1.4-1 3.2-1H36v6.4zM39 5h5q2.2 0 3.6 1.6l4.4 4.8H39z"/>'
      + '<path class="z-streif" d="M2 19.4H73V22q0 2-2 2H4q-2 0-2-2Z"/>'
      + zBogen(17, 24, 7.6) + zBogen(58, 24, 7.6) + zRad(17, 24.5, 5.5) + zRad(58, 24.5, 5.5)
      + '<rect x="70.4" y="15" width="2.6" height="3" rx="1" class="z-licht"/><rect x="2" y="15" width="2" height="3.6" rx="1" class="z-rueck"/><rect x="69" y="12.4" width="3" height="2.2" rx="1" class="z-blink blink"/><rect x="2" y="11.8" width="2" height="2.6" rx="1" class="z-blink blink"/>' })
  };
  const fzDaten = bild => (Object.prototype.hasOwnProperty.call(FZ, bild) ? FZ[bild] : FZ.solobus)();
  /* Bild für die Modellkarte: alle im selben Maßstab, damit der Gelenkbus auch länger aussieht */
  function fzBild(bild) {
    const f = fzDaten(bild);
    return `<svg class="fzb" viewBox="-4 ${f.h - 78} 312 80" aria-hidden="true">${f.svg}</svg>`;
  }
  /* Die Haltestelle: Sonne und Berge aus dem Logo, davor das Fahrzeug am Haltestellenschild */
  function szeneHtml(bild, klasse, stil) {
    const f = fzDaten(bild);
    return `<svg class="szene${klasse ? ' ' + klasse : ''}"${stil ? ` style="${stil}"` : ''} viewBox="0 0 400 112" role="img" aria-label="Fahrzeug an der Haltestelle">
      <circle cx="252" cy="42" r="20" class="z-sonne"/>
      <path d="M0 86V62l34-22 30 17 44-36 44 40 26-13 62 38z" class="z-berg1"/>
      <path d="M92 86l104-58 36 26 30-16 78 48z" class="z-berg2"/>
      <rect x="0" y="86" width="400" height="18" class="z-strasse"/>
      <path d="M8 95h26M62 95h26M116 95h26M170 95h26M224 95h26M278 95h26M332 95h26M386 95h14" class="z-linie"/>
      <rect x="0" y="103" width="400" height="9" class="z-steig"/><rect x="0" y="102" width="400" height="2" class="z-bord"/>
      <g transform="translate(${326 - f.l} ${99 - f.h})"><g class="fz">${f.svg}</g></g>
      <g class="z-mast"><rect x="351.5" y="38" width="3" height="68" rx="1.5" class="z-pfahl"/><circle cx="353" cy="29" r="11.5" class="z-hgelb"/><circle cx="353" cy="29" r="9.3" class="z-hring"/><path d="M349.4 24.3v9.4M356.6 24.3v9.4M349.4 29h7.2" class="z-hh"/><rect x="347" y="50" width="12" height="15" rx="1.5" class="z-plan"/><path d="M349.6 54.5h6.8M349.6 57.5h6.8M349.6 60.5h4.4" class="z-planl"/></g>
    </svg>`;
  }

  /* ---------- Start ---------- */
  async function laden() {
    const st = $('#start');
    st.hidden = false; st.innerHTML = '<p class="laedt">Lädt …</p>';
    const uebernehmen = d => {
      Object.assign(S, { ich: d.ich, fz: d.fahrzeuge || [], modelle: d.modelle || [], cl: d.checkliste, einst: d.einst, meine: d.meine, ad: null, adTage: 0, fs: d.fs || null, fsListe: null, push: d.push || '', maxUpload: d.maxUpload || 0 });
      st.hidden = true;
      aufbauen();
    };
    try {
      const d = await api('startDaten');
      ls.set('mak_start', JSON.stringify(d));
      uebernehmen(d);
    } catch (e) {
      let alt = null;
      if (netzFehler(e) && S.token) { try { alt = JSON.parse(ls.get('mak_start') || 'null'); } catch (x) { } }
      if (alt && alt.ich) { uebernehmen(alt); toast('Offline: Du kannst die Kontrolle ausfüllen. Gespeichert wird, sobald wieder Netz da ist.'); return; }
      st.innerHTML = `<div><p class="fehler">${esc(fehlerText(e))}</p><button type="button" class="haupt" id="nochmal">Erneut versuchen</button></div>`;
      $('#nochmal').addEventListener('click', laden);
    }
  }

  const initialen = name => { const t = String(name || '').trim().split(/\s+/).filter(Boolean); return ((t[0] || '?')[0] + (t.length > 1 ? t[t.length - 1][0] : '')).toUpperCase(); };
  const vorname = name => String(name || '').trim().split(/\s+/)[0] || '';

  function aufbauen() {
    document.body.classList.toggle('rolle-admin', !!S.ich.admin);
    document.body.classList.toggle('rolle-fahrer', !S.ich.admin);
    $('#firma').textContent = S.einst.firma || CFG.firma || '';
    const w = $('#wer');
    w.textContent = initialen(S.ich.name);
    w.setAttribute('aria-label', 'Profil von ' + S.ich.name);
    w.hidden = false;
    dockBauen();
    fsZahl();
    F = neuesFormular();
    entwurfLaden();
    S.flowFertig = false;
    renderNeu();
    renderMeine();
    zeige(S.ich.admin ? 'uebersicht' : (location.hash === '#fuehrerschein' ? 'fs' : 'start'));
    installZeigen();
    if (!S.ich.admin) pushAbgleichen();
    if (S.ich.admin && CFG.extern && CFG.braucht) {
      /* erst wenn die Webseite frisch geantwortet hat – sonst gäbe es nach einem Plugin-Update einen falschen Alarm */
      konfigBereit.then(da => {
        if (da && S.ich && S.ich.admin && CFG.plugin && versionKleiner(CFG.plugin, CFG.braucht)) {
          setTimeout(() => toast('Bitte das Plugin in WordPress aktualisieren: Die App braucht Version ' + CFG.braucht + ', installiert ist ' + CFG.plugin + '.', true), 2600);
        }
      });
    }
  }

  /* Leiste unten: vier Bereiche, in der Mitte der große Knopf für die Kontrolle */
  function dockBauen() {
    const punkte = S.ich.admin
      ? [['uebersicht', 'Übersicht', 'raster'], ['maengel', 'Mängel', 'warn'], ['neu', 'Prüfen', 'pruefen'], ['fahrzeuge', 'Busse', 'bus'], ['fahrer', 'Fahrer', 'fahrer']]
      : [['start', 'Start', 'halt'], ['meine', 'Verlauf', 'verlauf'], ['neu', 'Prüfen', 'pruefen'], ['fs', 'Führerschein', 'ausweis'], ['profil', 'Profil', 'person']];
    $('#tabs').innerHTML = '<div class="dock-in">' + punkte.map(([v, t, i]) => v === 'neu'
      ? `<button type="button" class="fab" data-view="neu"><span class="fab-k">${ic(i, 28, 2.1)}</span><span>${t}</span></button>`
      : `<button type="button" class="di" data-view="${v}"><span class="di-ic">${ic(i, 24)}${v === 'maengel' ? '<span class="zahl" id="offenZahl" hidden></span>' : ''}${v === 'fs' ? '<span class="zahl warn" id="fsZahl" hidden>!</span>' : ''}</span><span>${t}</span></button>`).join('') + '</div>';
    $('#tabs').hidden = false;
  }

  function zeige(v) {
    if (v === 'neu') { flowAuf(); return; }
    if (!$('#v-' + v)) v = S.ich && S.ich.admin ? 'uebersicht' : 'start';
    toastWeg();
    S.view = v;
    $$('#tabs [data-view]').forEach(b => { const an = b.dataset.view === v; b.classList.toggle('an', an); if (an) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    $('#wer').classList.toggle('an', v === 'profil');
    $$('main > section.view').forEach(s => { s.hidden = s.id !== 'v-' + v; });
    if (S.ich && S.ich.admin && ['uebersicht', 'maengel', 'fahrzeuge', 'fahrer'].includes(v)) {
      if (!S.ad) { $('#v-' + v).innerHTML = '<p class="laden">Lädt …</p>'; adminLaden(); }
    }
    if (v === 'start') renderStart();
    if (v === 'fs') renderFs();
    if (v === 'profil') renderProfil();
    uhr();
    window.scrollTo(0, 0);
  }
  /* Tipp auf die Erinnerung, während die App schon offen ist */
  window.addEventListener('hashchange', () => { if (location.hash === '#fuehrerschein' && S.ich && !S.ich.admin && vNeu.hidden) zeige('fs'); });
  document.addEventListener('click', ev => {
    const b = ev.target.closest('[data-view]');
    if (!b || !S.ich) return;
    if (b.closest('#tabs') && b.dataset.view !== 'neu') Ton.spiel('tipp');
    zeige(b.dataset.view);
  });

  /* ---------- Startseite der Fahrer: die Haltestelle ---------- */
  function gruss() {
    const h = Number(new Date().toLocaleTimeString('de-DE', { timeZone: TZ, hour: '2-digit', hour12: false }).slice(0, 2));
    return h >= 4 && h < 11 ? 'Guten Morgen' : h >= 11 && h < 18 ? 'Guten Tag' : h >= 18 && h < 22 ? 'Guten Abend' : 'Hallo';
  }
  const bildVon = k => { const m = k && k.mod ? S.modelle.find(x => x.name === k.mod) : null; return m ? m.bild : (k && ARTEN[k.art] ? k.art : ''); };
  const hatEntwurf = () => !!(F && (Object.keys(F.erg).length || F.kz || F.km || F.typ));
  function renderStart() {
    const el = $('#v-start');
    if (!el || !S.ich || S.ich.admin) return;
    const heute = tag(Date.now());
    const kHeute = S.meine.find(k => tag(k.ts) === heute);
    const entwurf = hatEntwurf();
    const info = F ? typInfo(F.typ) : null;
    const bild = (entwurf && info ? info.bild : '') || bildVon(S.meine[0]) || (S.modelle[0] ? S.modelle[0].bild : 'solobus');
    const fs = S.fs;
    const zeilen = [['Kontrolle heute', kHeute ? fZeit(kHeute.ts) + ' ' + kHeute.kz : 'noch offen', kHeute ? (kHeute.ok ? 'gut' : 'alarm') : '']];
    if (entwurf) zeilen.push(['Angefangen', (F.kz && KZ_OK.test(F.kz) ? F.kz + ', ' : '') + zaehlen().fertig + ' von ' + S.cl.length, '']);
    if (fs) zeilen.push(['Führerschein', fs.erledigt ? 'erledigt' : fs.ueberfaellig ? 'überfällig' : 'bis ' + fDatumKurz(fs.bis), fs.erledigt ? 'gut' : fs.ueberfaellig ? 'alarm' : '']);
    const neu = !S.angekommen && !RUHIG;
    const warte = neu ? Math.max(0, startBis - Date.now()) : 0;      // der Bus fährt erst vor, wenn das Logo weg ist
    const letzte = S.meine.slice(0, 3);
    el.innerHTML = `
      <section class="halt">
        <div class="halt-text"><span>${gruss()},</span><b>${esc(vorname(S.ich.name))}</b></div>
        ${szeneHtml(bild, neu ? 'kommt' : 'offen', neu ? '--vz:' + warte + 'ms' : '')}
        ${tafelHtml(zeilen, S.einst.firma || CFG.firma || 'Abfahrt')}
      </section>
      <button type="button" class="los" data-view="neu"><span class="los-ic">${ic('pruefen', 30, 2)}</span><span class="los-t"><b>${entwurf ? 'Kontrolle fortsetzen' : 'Kontrolle starten'}</b><small>${plural(anzahlHalte(), 'Haltestelle', 'Haltestellen')}, ${plural(S.cl.length, 'Prüfpunkt', 'Prüfpunkte')}</small></span>${ic('rechts', 24, 2.4)}</button>
      ${entwurf ? '<p class="unter-los"><button type="button" class="link" id="sVerwerfen">Angefangene Kontrolle verwerfen</button></p>' : ''}
      ${fsHinweisHtml()}
      <div class="install-banner" id="installBanner" hidden></div>
      ${letzte.length ? `<div class="abschnitt"><h2>Letzte Kontrollen</h2><button type="button" class="link" data-view="meine">Alle ansehen</button></div><div class="vliste">${letzte.map(k => vzHtml(k, true)).join('')}</div>` : ''}`;
    uhr();
    installZeigen();
    if (neu) {
      S.angekommen = true;
      setTimeout(() => { const sz = $('#v-start .szene'); if (sz && sz.classList.contains('kommt')) { sz.classList.remove('kommt'); sz.classList.add('offen'); } }, warte + 1300);
    }
  }
  $('#v-start').addEventListener('click', ev => {
    const t = ev.target.closest('#sVerwerfen');
    if (!t || !nachfragen(t)) return;
    Object.keys(F.medien).forEach(k => F.medien[k].forEach(m => blobWeg(m.lid)));
    F = neuesFormular(); ls.del(entwurfKey());
    renderNeu(); renderStart();
    toast('Verworfen. Die nächste Kontrolle beginnt von vorn.');
  });

  /* ---------- Profil: Töne, Vibration, App installieren, Abmelden ---------- */
  function renderProfil() {
    const el = $('#v-profil');
    if (!el || !S.ich) return;
    el.innerHTML = `<h2 class="titel">Profil</h2>
      <section class="karte prof"><span class="avatar">${esc(initialen(S.ich.name))}</span><div><b>${esc(S.ich.name)}</b><small>${S.ich.admin ? 'Admin, sieht alle Kontrollen' : 'Fahrer'}${S.einst.firma ? ' bei ' + esc(S.einst.firma) : ''}</small></div></section>
      <section class="karte">
        <h2>Töne und Vibration</h2>
        <label class="schalter"><span><b>Töne</b><small>Kurze Signale beim Abhaken, Gong bei der Abfahrt</small></span><input type="checkbox" id="pTon"${Ton.istAn() ? ' checked' : ''}><i aria-hidden="true"></i></label>
        ${Ton.vibGeht ? `<label class="schalter"><span><b>Vibration</b><small>Kurzes Ruckeln als Bestätigung</small></span><input type="checkbox" id="pVib"${Ton.vibAn() ? ' checked' : ''}><i aria-hidden="true"></i></label>` : ''}
        <div class="aktionen" style="margin-top:14px"><button type="button" class="mini" id="pProbe">${ic('ton', 20)}<span>Gong anhören</span></button></div>
        <p class="mute klein" style="margin-bottom:0">Die Lautstärke regelst du mit den Tasten am Handy. Am iPhone bleibt die App still, solange der Stummschalter an ist.</p>
      </section>
      <section class="karte install" id="installProfil" hidden></section>
      <section class="karte">
        <button type="button" class="mini rot breit" data-abmelden>Abmelden</button>
        <p class="mute klein" style="margin:12px 0 0;text-align:center">Abfahrtskontrolle ${esc(CFG.version || '')}</p>
      </section>`;
    installZeigen();
  }
  $('#v-profil').addEventListener('change', ev => {
    const t = ev.target;
    if (t.id === 'pTon') { Ton.setAn(t.checked); if (t.checked) Ton.spiel('halt'); }
    else if (t.id === 'pVib') { Ton.setVib(t.checked); if (t.checked) Ton.spiel('ok'); }
  });
  $('#v-profil').addEventListener('click', ev => {
    if (!ev.target.closest('#pProbe')) return;
    if (!Ton.istAn()) return toast('Die Töne sind ausgeschaltet.');
    Ton.spiel('abfahrt');
  });

  /* ---------- Neue Kontrolle: geführt von Haltestelle zu Haltestelle ---------- */
  const neuesFormular = () => ({ kz: '', art: '', modell: '', typ: '', frei: '', km: '', erg: {}, medien: {}, fb: null, bem: '', best: false, t: Date.now(), schritt: 0 });
  const entwurfKey = () => 'mak_entwurf_' + (S.ich ? S.ich.name : '');
  let entwurfT = 0;
  function entwurfSpeichern() { clearTimeout(entwurfT); entwurfT = setTimeout(() => ls.set(entwurfKey(), JSON.stringify(F)), 300); }
  function entwurfLaden() {
    try {
      const d = JSON.parse(ls.get(entwurfKey()) || 'null');
      if (d && Date.now() - d.t < 12 * 36e5) F = Object.assign(neuesFormular(), d);
    } catch (e) { }
  }

  /* Fahrzeugwahl: „typ“ ist entweder ein Modell (m:…) oder nur die Fahrzeugart (a:…) */
  const modellVon = id => S.modelle.find(m => m.id === id) || null;
  const bekanntesFz = kz => S.fz.find(v => v.kz === kz);
  const typVon = v => (v.modell && modellVon(v.modell) ? 'm:' + v.modell : 'a:' + (ARTEN[v.art] ? v.art : 'solobus'));
  function typInfo(typ) {
    if (!typ) return null;
    if (typ[0] === 'm') { const m = modellVon(typ.slice(2)); return m ? { name: m.name, art: m.art, bild: m.bild, modell: m.id } : null; }
    const a = typ.slice(2);
    return ARTEN[a] ? { name: ARTEN[a], art: a, bild: a, modell: '' } : null;
  }
  /* Passt ein Bus aus der Liste zur Auswahl? Sein eigenes Modell zählt; hat er noch keins, passt er zu jedem Modell seiner Fahrzeugart. */
  function passt(v, typ) {
    const i = typInfo(typ);
    if (!i) return false;
    return v.modell && modellVon(v.modell) ? typ === 'm:' + v.modell : i.art === v.art;
  }
  function fzSetzen(v) {
    const eigen = v.modell && modellVon(v.modell) ? v.modell : '';
    const wahl = typInfo(F.typ);
    const mod = eigen || (wahl && wahl.modell && wahl.art === v.art ? wahl.modell : '');
    F.kz = v.kz; F.art = v.art; F.modell = mod; F.typ = mod ? 'm:' + mod : 'a:' + v.art; F.frei = '';
  }
  function typAbleiten() {
    if (!typInfo(F.typ)) F.typ = F.modell && modellVon(F.modell) ? 'm:' + F.modell : ARTEN[F.art] ? 'a:' + F.art : '';
    const v = bekanntesFz(F.kz);
    if (v) { const frei = F.frei; fzSetzen(v); F.frei = frei; return; }
    if (F.kz && !F.frei) F.frei = F.kz;
    const i = typInfo(F.typ);
    F.art = i ? i.art : ''; F.modell = i ? i.modell : '';
  }

  const anzahlHalte = () => S.gruppen.length + 2;
  const schrittName = i => (i === 0 ? 'Fahrzeug' : i > S.gruppen.length ? 'Abfahrt' : S.gruppen[i - 1].b);
  function zaehlen() {
    let fertig = 0, mz = 0;
    S.cl.forEach(p => { const e = F.erg[p.k]; if (e && e.s) { fertig++; if (e.s === 'mangel') mz++; } });
    return { fertig, mz };
  }
  /* Was an einer Haltestelle noch fehlt (kurz) – leer, wenn alles da ist */
  function offenText(i) {
    if (i === 0) return !F.kz ? 'Kennzeichen' : !KZ_OK.test(F.kz) ? 'Kennzeichen prüfen' : !ARTEN[F.art] ? 'Fahrzeug' : !F.km ? 'km-Stand' : '';
    const g = S.gruppen[i - 1];
    if (!g) return '';
    let n = 0, ohne = 0;
    g.pp.forEach(j => { const e = F.erg[S.cl[j].k]; if (!e || !e.s) n++; else if (e.s === 'mangel' && !String(e.n || '').trim()) ohne++; });
    return n ? plural(n, 'Punkt', 'Punkte') : ohne ? 'Mangel beschreiben' : '';
  }
  function schrittStand(i) {
    if (i === 0) return !offenText(0) ? 'voll' : (F.kz || F.km || F.typ) ? 'teil' : 'leer';
    if (i > S.gruppen.length) return F.best && (!zaehlen().mz || F.fb !== null) ? 'voll' : 'leer';
    let f = 0, m = 0;
    S.gruppen[i - 1].pp.forEach(j => { const e = F.erg[S.cl[j].k]; if (e && e.s) { f++; if (e.s === 'mangel') m++; } });
    return !f ? 'leer' : offenText(i) ? 'teil' : m ? 'mangel' : 'voll';
  }

  function renderNeu() {
    const gruppen = [];
    S.cl.forEach((p, i) => { let g = gruppen.find(x => x.b === p.b); if (!g) gruppen.push(g = { b: p.b, pp: [] }); g.pp.push(i); });
    S.gruppen = gruppen;
    const n = gruppen.length + 1;
    if (!(F.schritt >= 0 && F.schritt <= n)) F.schritt = 0;
    typAbleiten();
    S.flowFertig = false;
    vNeu.innerHTML = `
      <header class="fl-kopf"><div class="fl-in">
        <div class="fl-zeile">
          <button type="button" class="fl-rund" id="fZu" aria-label="Kontrolle schließen">${ic('x', 22, 2.4)}</button>
          <div class="fl-titel"><small id="fHalt"></small><b id="fTitel"></b></div>
          <span class="fl-stand" id="fStand"></span>
        </div>
        <div class="perl" id="fPerl">${Array.from({ length: n + 1 }, (_, i) => `<button type="button" class="pk" data-halt="${i}" aria-label="Halt ${i + 1}: ${esc(schrittName(i))}"><i></i></button>`).join('')}<span class="perl-bus" aria-hidden="true"><svg viewBox="0 0 26 13" width="26" height="13"><rect x=".7" y=".7" width="24.6" height="9.2" rx="2.4" fill="#fff"/><rect x="3" y="2.6" width="14.5" height="3.3" rx=".8" fill="var(--band)"/><rect x="19.2" y="2.6" width="4" height="5" rx=".8" fill="var(--band)"/><circle cx="7" cy="10.4" r="2.1" fill="#fff" stroke="var(--band)" stroke-width="1.2"/><circle cx="19" cy="10.4" r="2.1" fill="#fff" stroke="var(--band)" stroke-width="1.2"/></svg></span></div>
      </div></header>
      <div class="fl-inhalt" id="fInhalt">
        <section class="schritt" data-schritt="0" id="fFahrzeug">
          <div id="fTypWahl"></div>
          <div id="fTypDa" hidden>
            <div class="gewaehlt" id="fGewaehlt"></div>
            <section class="karte">
              <h2>Kennzeichen</h2>
              <div class="kzwahl" id="fChips"></div>
              <label class="feld"><span>Anderes Kennzeichen eintragen</span><input id="fKzFrei" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="15" placeholder="z. B. DU-AB 1234"></label>
            </section>
            <section class="karte">
              <label class="feld erste"><span>km-Stand</span><input id="fKm" class="gross" inputmode="numeric" autocomplete="off" maxlength="8" placeholder="z. B. 412380"></label>
            </section>
          </div>
        </section>
        ${gruppen.map((g, gi) => `
        <section class="schritt" data-schritt="${gi + 1}" hidden>
          <div class="ab-kopf"><span class="ab-ic">${bereichIcon(g.b)}</span><div><h2>${esc(g.b)}</h2><p data-gz="${gi}"></p></div><button type="button" class="mini" data-alleok="${gi}">Alle übrigen OK</button></div>
          <div class="pps">${g.pp.map(ppHtml).join('')}</div>
        </section>`).join('')}
        <section class="schritt" data-schritt="${n}" id="fEnde" hidden>
          <div class="ab-kopf"><span class="ab-ic">${ic('ziel', 26)}</span><div><h2>Abfahrt</h2><p>Kurz prüfen, dann speichern.</p></div></div>
          <div id="fZus"></div>
          <section class="karte" id="fFb" hidden>
            <h2>Ist das Fahrzeug fahrbereit?</h2>
            <p class="mute" id="fFbText"></p>
            <div class="wahl2"><button type="button" data-fb="1">Ja, Mangel ist geringfügig</button><button type="button" data-fb="0" class="rot">Nein, nicht fahrbereit</button></div>
          </section>
          <section class="karte">
            <label class="feld erste"><span>Bemerkung (optional)</span><textarea id="fBem" rows="3" maxlength="1000"></textarea></label>
            <label class="check" id="fBestBox"><input type="checkbox" id="fBest"><span>Ich habe die Abfahrtskontrolle selbst und gewissenhaft durchgeführt.</span></label>
          </section>
        </section>
      </div>
      <footer class="fl-fuss"><div class="fl-in">
        <button type="button" class="fl-zurueck" id="fZurueck" aria-label="Einen Halt zurück">${ic('links', 24, 2.4)}</button>
        <button type="button" class="fl-weiter" id="fWeiter"><span><small></small><b></b></span>${ic('rechts', 24, 2.4)}</button>
        <button type="button" class="fl-weiter senden" id="fSenden" hidden><span><b>Kontrolle speichern</b></span>${ic('ok', 24, 2.6)}</button>
      </div></footer>`;
    $('#fKzFrei').value = F.frei;
    $('#fKm').value = F.km;
    $('#fBem').value = F.bem;
    $('#fBest').checked = F.best;
    renderTyp();
    S.cl.forEach((p, i) => ppSetzen(i));
    zuSchritt(F.schritt, 0);
  }

  function ppHtml(i) {
    const p = S.cl[i];
    return `<div class="pp" data-i="${i}">
      <div class="pp-t">${esc(p.p)}</div>
      <div class="seg" role="group" aria-label="${esc(p.p)}"><button type="button" data-s="ok">${ic('ok', 20, 2.8)}<span>OK</span></button><button type="button" data-s="mangel">${ic('warn', 20, 2.2)}<span>Mangel</span></button><button type="button" data-s="na">${ic('minus', 20, 2.8)}<span>entfällt</span></button></div>
      <textarea class="pp-n" rows="2" maxlength="300" placeholder="Was genau ist defekt? (Pflicht)" hidden></textarea>
      <div class="pp-medien" hidden><div class="thumbs"></div><button type="button" class="mini kam-btn" data-aufnahme>${IC.kamera}<span>Foto / Video</span></button></div>
    </div>`;
  }

  function ppSetzen(i) {
    const el = $(`.pp[data-i="${i}"]`);
    if (!el) return;
    const e = F.erg[S.cl[i].k] || {};
    el.dataset.st = e.s || '';
    $$('.seg button', el).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.s === e.s)));
    const ta = $('.pp-n', el);
    ta.hidden = e.s !== 'mangel';
    if (ta.value !== (e.n || '')) ta.value = e.n || '';
    $('.pp-medien', el).hidden = e.s !== 'mangel';
    if (e.s === 'mangel') thumbsZeigen(i);
  }

  /* Halt 1: erst das Modell antippen, dann das Kennzeichen */
  function renderTyp() {
    const wahl = $('#fTypWahl'), da = $('#fTypDa');
    if (!wahl) return;
    const info = typInfo(F.typ);
    wahl.hidden = !!info; da.hidden = !info;
    if (!info) {
      /* Die zwei zuletzt gefahrenen Busse aus der Liste – mit dem Modell, das zuletzt dazu gewählt war */
      const zuletzt = [];
      S.meine.forEach(k => {
        const v = bekanntesFz(k.kz);
        if (!v || zuletzt.length >= 2 || zuletzt.some(z => z.v === v)) return;
        const m = !v.modell && k.mod ? S.modelle.find(x => x.name === k.mod && x.art === v.art) : null;
        zuletzt.push({ v, typ: m ? 'm:' + m.id : typVon(v) });
      });
      wahl.innerHTML = `
        <div class="ab-kopf"><span class="ab-ic">${ic('bus', 26)}</span><div><h2>Welches Fahrzeug fährst du?</h2><p>Tippe dein Fahrzeug an.</p></div></div>
        ${zuletzt.length ? `<h3 class="zw">Zuletzt gefahren</h3><div class="kzwahl">${zuletzt.map(z => `<button type="button" class="kzbtn" data-schnell="${esc(z.v.kz)}" data-vor="${esc(z.typ)}">${kzHtml(z.v.kz)}<small>${esc(typInfo(z.typ).name)}</small></button>`).join('')}</div>` : ''}
        ${S.modelle.length ? `<h3 class="zw">Unsere Busse</h3><div class="mkarten">${S.modelle.map(m => { const z = S.fz.filter(v => v.modell === m.id).length; return `<button type="button" class="mkarte" data-typ="m:${esc(m.id)}"><span class="mk-bild">${fzBild(m.bild)}</span><b>${esc(m.name)}</b><small>${esc(ARTEN[m.art])}${z ? ', ' + plural(z, 'Kennzeichen', 'Kennzeichen') : ''}</small></button>`; }).join('')}</div>` : ''}
        <h3 class="zw">${S.modelle.length ? 'Anderes Fahrzeug' : 'Fahrzeugart'}</h3>
        <div class="akarten">${Object.keys(ARTEN).map(a => `<button type="button" class="akarte" data-typ="a:${a}">${ARTICON[a]}<span>${ARTEN[a]}</span></button>`).join('')}</div>`;
      return;
    }
    const liste = S.fz.filter(v => passt(v, F.typ));
    const eigene = liste.filter(v => typVon(v) === F.typ), ohne = liste.filter(v => typVon(v) !== F.typ);
    const chip = v => `<button type="button" class="kzbtn" data-kz="${esc(v.kz)}">${kzHtml(v.kz)}${v.bez ? `<small>${esc(v.bez)}</small>` : ''}</button>`;
    $('#fGewaehlt').innerHTML = `${szeneHtml(info.bild, 'offen')}<div class="gw-text"><div><b>${esc(info.name)}</b>${info.modell ? `<small>${esc(ARTEN[info.art])}</small>` : ''}</div><button type="button" class="mini" id="fTypAendern">Anderes Fahrzeug</button></div>`;
    $('#fChips').innerHTML = liste.length
      ? eigene.map(chip).join('') + (ohne.length ? `<p class="kz-zw">${esc(ARTEN[info.art])} ohne hinterlegtes Modell</p>` + ohne.map(chip).join('') : '')
      : '<p class="mute" style="margin:0">Dafür ist noch kein Kennzeichen hinterlegt. Trag es unten ein.</p>';
    kmHinweis();
  }
  function kmHinweis() {
    const km = $('#fKm');
    if (!km) return;
    const alt = F.kz ? S.meine.find(k => k.kz === F.kz) : null;
    km.placeholder = alt ? 'zuletzt ' + fKm(alt.km) : 'z. B. 412380';
  }

  function zusammenfassung() {
    const el = $('#fZus');
    if (!el) return;
    const info = typInfo(F.typ);
    let ok = 0, na = 0;
    const maengel = [];
    S.cl.forEach(p => { const e = F.erg[p.k]; if (!e || !e.s) return; if (e.s === 'ok') ok++; else if (e.s === 'na') na++; else maengel.push({ p, e }); });
    const offen = [];
    for (let i = 0; i <= S.gruppen.length; i++) { const t = offenText(i); if (t) offen.push({ i, t }); }
    el.innerHTML = `
      <section class="karte zus">
        <div class="zus-fz">${F.kz && KZ_OK.test(F.kz) ? kzHtml(F.kz, true) : ''}<div><b>${esc(info ? info.name : 'Fahrzeug fehlt noch')}</b><small>${F.km ? 'km-Stand ' + fKm(F.km) : 'km-Stand fehlt noch'}</small></div></div>
        <div class="zus-zahlen"><div class="g"><b>${ok}</b><span>in Ordnung</span></div><div class="${maengel.length ? 'r' : ''}"><b>${maengel.length}</b><span>${maengel.length === 1 ? 'Mangel' : 'Mängel'}</span></div><div><b>${na}</b><span>entfällt</span></div></div>
        ${maengel.length ? `<ul class="mliste">${maengel.map(m => { const z = (F.medien[m.p.k] || []).length; return `<li><b>${esc(m.p.p)}</b><span>${esc(String(m.e.n || '').trim() || 'Beschreibung fehlt noch')}</span>${z ? `<small>${plural(z, 'Aufnahme', 'Aufnahmen')}</small>` : ''}</li>`; }).join('')}</ul>` : ''}
      </section>
      ${offen.length ? `<section class="karte offenb"><h2>Noch offen</h2><p class="mute">Tippe einen Halt an, um dorthin zu springen.</p><div class="offenl">${offen.map(o => `<button type="button" class="mini" data-halt="${o.i}"><b>${esc(schrittName(o.i))}</b><span>${esc(o.t)}</span></button>`).join('')}</div></section>` : ''}`;
  }

  function formAktualisieren() {
    if (!$('#fInhalt')) return;
    const { fertig, mz } = zaehlen();
    const n = S.gruppen.length + 1, cur = F.schritt;
    S.gruppen.forEach((g, gi) => {
      const f = g.pp.filter(i => (F.erg[S.cl[i].k] || {}).s).length;
      $(`[data-gz="${gi}"]`).textContent = f === g.pp.length ? 'Alle ' + g.pp.length + ' geprüft' : f + ' von ' + g.pp.length + ' geprüft';
      $(`[data-alleok="${gi}"]`).hidden = f === g.pp.length;
    });
    $('#fTitel').textContent = schrittName(cur);
    $('#fHalt').textContent = 'Halt ' + (cur + 1) + ' von ' + (n + 1);
    $('#fStand').textContent = fertig + '/' + S.cl.length;
    $('#fStand').setAttribute('aria-label', fertig + ' von ' + S.cl.length + ' Prüfpunkten erledigt');
    const perl = $('#fPerl');
    perl.style.setProperty('--p', n ? cur / n : 0);
    $$('.pk', perl).forEach((b, i) => {
      b.className = 'pk ' + schrittStand(i) + (i === cur ? ' an' : '');
      if (i === cur) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    const ende = cur === n;
    $('#fZurueck').hidden = cur === 0;
    $('#fWeiter').hidden = ende;
    $('#fSenden').hidden = !ende;
    if (!ende) {
      const o = offenText(cur), w = $('#fWeiter');
      w.classList.toggle('wartet', !!o);
      $('small', w).textContent = o ? 'Noch offen: ' + o : 'Nächster Halt';
      $('b', w).textContent = schrittName(cur + 1);
    }
    if (!mz) F.fb = null;
    $('#fFb').hidden = !mz;
    $('#fFbText').textContent = mz ? `Du hast ${plural(mz, 'Mangel', 'Mängel')} eingetragen. Darf das Fahrzeug trotzdem fahren?` : '';
    $$('[data-fb]').forEach(b => b.setAttribute('aria-pressed', String(F.fb === (b.dataset.fb === '1'))));
    $$('#fChips .kzbtn').forEach(b => b.setAttribute('aria-pressed', String(!!F.kz && b.dataset.kz === F.kz)));
    if (ende) zusammenfassung();
  }

  function aendern() { formAktualisieren(); if ($('#fInhalt')) entwurfSpeichern(); }

  function zuSchritt(n, richtung) {
    n = Math.max(0, Math.min(S.gruppen.length + 1, n));
    F.schritt = n;
    $$('.schritt', vNeu).forEach(s => {
      const an = +s.dataset.schritt === n;
      s.hidden = !an;
      s.classList.remove('rein-r', 'rein-l');
      if (an && richtung) { void s.offsetWidth; s.classList.add(richtung > 0 ? 'rein-r' : 'rein-l'); }
    });
    const inh = $('#fInhalt');
    if (inh) inh.scrollTop = 0;
    formAktualisieren();
    if (richtung) entwurfSpeichern();
  }

  /* Solange die Kontrolle offen ist, ist alles dahinter für Tastatur und Vorlesen gesperrt */
  function flowSperre(an) {
    document.body.classList.toggle('im-flow', an);
    ['#kopf', '#main', '#tabs'].forEach(s => { const el = $(s); if (el) el.inert = an; });
  }
  function flowAuf() {
    if (!S.ich) return;
    if (S.flowFertig || !$('#fInhalt')) renderNeu();
    toastWeg();
    vNeu.hidden = false;
    flowSperre(true);
    vNeu.classList.remove('auf'); void vNeu.offsetWidth; vNeu.classList.add('auf');
    try { $('#fZu').focus({ preventScroll: true }); } catch (e) { }
    halten();
    Ton.spiel('tipp');
  }
  function flowZu() {
    if (vNeu.hidden) return;
    S.abLauf = null;
    vNeu.hidden = true;
    flowSperre(false);
    if (S.flowFertig) renderNeu();
    loslassen();
    if (S.ich && !S.ich.admin && S.view === 'start') renderStart();
  }

  /* Antwort auf einen Prüfpunkt: Ton, Häkchen, weiter zum nächsten offenen Punkt */
  function antworten(pp, s) {
    const i = +pp.dataset.i, k = S.cl[i].k;
    const vorher = schrittStand(F.schritt);
    const e = F.erg[k] || (F.erg[k] = {});
    e.s = s;
    ppSetzen(i);
    pp.style.removeProperty('--d');
    pp.classList.remove('fehlt', 'frisch'); void pp.offsetWidth; pp.classList.add('frisch');
    const g = S.gruppen[F.schritt - 1];
    Ton.spiel(s, g ? g.pp.filter(j => (F.erg[S.cl[j].k] || {}).s === 'ok').length - 1 : 0);
    aendern();
    if (s === 'mangel') { if (!e.n) { try { $('.pp-n', pp).focus(); } catch (x) { } } return; }
    const jetzt = schrittStand(F.schritt);
    if (vorher !== jetzt && (jetzt === 'voll' || jetzt === 'mangel')) return haltFertig();
    const rest = $$('.pp', pp.parentNode);
    const naechster = rest.slice(rest.indexOf(pp) + 1).find(x => !x.dataset.st);
    if (naechster) setTimeout(() => naechster.scrollIntoView({ behavior: RUHIG ? 'auto' : 'smooth', block: 'center' }), 160);
  }
  function haltFertig() {
    setTimeout(() => Ton.spiel('halt'), 180);
    const w = $('#fWeiter');
    if (w && !w.hidden) { w.classList.remove('bereit'); void w.offsetWidth; w.classList.add('bereit'); }
    const p = $('#fPerl .pk.an');
    if (p) { p.classList.remove('puls'); void p.offsetWidth; p.classList.add('puls'); }
  }

  const vNeu = $('#v-neu');
  vNeu.addEventListener('click', ev => {
    const t = ev.target.closest('button');
    if (!t) return;
    const d = t.dataset;
    if (d.typ) { const v = bekanntesFz(F.kz); if (v && !passt(v, d.typ)) { F.kz = ''; F.frei = ''; $('#fKzFrei').value = ''; } F.typ = d.typ; F.modell = ''; F.art = ''; typAbleiten(); renderTyp(); $('#fFahrzeug').classList.remove('fehlt'); Ton.spiel('tipp'); aendern(); $('#fInhalt').scrollTop = 0; return; }
    if (d.schnell) { const v = bekanntesFz(d.schnell); if (!v) return; F.typ = d.vor || ''; fzSetzen(v); $('#fKzFrei').value = ''; renderTyp(); Ton.spiel('tipp'); aendern(); try { $('#fKm').focus(); } catch (x) { } return; }
    if (t.id === 'fTypAendern') { F.typ = ''; F.kz = ''; F.frei = ''; F.art = ''; F.modell = ''; $('#fKzFrei').value = ''; renderTyp(); aendern(); return; }
    if (d.kz) { const v = bekanntesFz(d.kz); if (v) fzSetzen(v); else F.kz = d.kz; $('#fKzFrei').value = ''; $('#fFahrzeug').classList.remove('fehlt'); kmHinweis(); Ton.spiel('tipp'); aendern(); if (!F.km) { try { $('#fKm').focus(); } catch (x) { } } return; }
    if (d.s) { antworten(t.closest('.pp'), d.s); return; }
    if (d.alleok != null) {
      let z = 0;
      S.gruppen[+d.alleok].pp.forEach(i => {
        const k = S.cl[i].k;
        if (F.erg[k] && F.erg[k].s) return;
        F.erg[k] = { s: 'ok' }; ppSetzen(i);
        const pp = $(`.pp[data-i="${i}"]`);
        pp.classList.remove('fehlt', 'frisch'); pp.style.setProperty('--d', (z++ * 45) + 'ms'); void pp.offsetWidth; pp.classList.add('frisch');
      });
      aendern();
      if (!offenText(F.schritt)) haltFertig(); else Ton.spiel('ok');
      return;
    }
    if (d.halt != null) { const z = +d.halt; if (z !== F.schritt) { Ton.spiel('tipp'); zuSchritt(z, z > F.schritt ? 1 : -1); } return; }
    if (d.fb) { F.fb = d.fb === '1'; $('#fFb').classList.remove('fehlt'); Ton.spiel(F.fb ? 'na' : 'mangel'); aendern(); return; }
    if (t.hasAttribute('data-aufnahme')) { aufnehmen(+t.closest('.pp').dataset.i); return; }
    if (d.mweg) { medienWeg(d.mweg); return; }
    if (d.lid) { lokalZeigen(d.lid); return; }
    if (t.id === 'fWeiter') { Ton.spiel('tipp'); zuSchritt(F.schritt + 1, 1); return; }
    if (t.id === 'fZurueck') { Ton.spiel('tipp'); zuSchritt(F.schritt - 1, -1); return; }
    if (t.id === 'fSenden') { senden(); return; }
    if (t.id === 'fZu') { const offen = !S.flowFertig && hatEntwurf(); flowZu(); if (offen) toast('Angehalten. Du kannst die Kontrolle jederzeit fortsetzen.'); return; }
    if (t.id === 'fFertig') { flowZu(); if (S.ich && !S.ich.admin) zeige('start'); }
  });
  function formEingabe(ev) {
    const t = ev.target;
    if (t.id === 'fKzFrei') {
      F.frei = t.value; F.kz = normKz(t.value);
      const v = bekanntesFz(F.kz);
      if (v) { const alt = F.typ; fzSetzen(v); F.frei = t.value; if (alt !== F.typ) renderTyp(); }
      else { const i = typInfo(F.typ); F.art = i ? i.art : ''; F.modell = i ? i.modell : ''; }
      kmHinweis();
    }
    else if (t.id === 'fKm') { const v = t.value.replace(/\D/g, ''); if (v !== t.value) t.value = v; F.km = v; }
    else if (t.id === 'fBem') F.bem = t.value;
    else if (t.id === 'fBest') { F.best = t.checked; if (t.checked && ev.type === 'change') Ton.spiel('ok', 2); }
    else if (t.classList.contains('pp-n')) { const k = S.cl[+t.closest('.pp').dataset.i].k; (F.erg[k] || (F.erg[k] = { s: 'mangel' })).n = t.value; }
    else return;
    aendern();
  }
  vNeu.addEventListener('input', formEingabe);
  vNeu.addEventListener('change', formEingabe);

  function fehlt(el, text) {
    toast(text, true);
    if (!el) return;
    const sch = el.closest('.schritt');
    if (sch && +sch.dataset.schritt !== F.schritt) zuSchritt(+sch.dataset.schritt, +sch.dataset.schritt > F.schritt ? 1 : -1);
    setTimeout(() => {
      el.scrollIntoView({ behavior: RUHIG ? 'auto' : 'smooth', block: 'center' });
      el.classList.remove('fehlt'); void el.offsetWidth; el.classList.add('fehlt');
    }, 60);
  }

  async function senden() {
    if (!F.kz) return fehlt($('#fFahrzeug'), 'Bitte das Fahrzeug und das Kennzeichen wählen.');
    if (!KZ_OK.test(F.kz)) return fehlt($('#fKzFrei'), 'Das Kennzeichen sieht ungültig aus.');
    if (!ARTEN[F.art]) return fehlt($('#fFahrzeug'), 'Bitte das Fahrzeug wählen.');
    if (!F.km) return fehlt($('#fKm'), 'Bitte den km-Stand eintragen.');
    for (let i = 0; i < S.cl.length; i++) {
      const e = F.erg[S.cl[i].k];
      if (!e || !e.s) return fehlt($(`.pp[data-i="${i}"]`), 'Noch nicht geprüft: ' + S.cl[i].p);
      if (e.s === 'mangel' && !String(e.n || '').trim()) return fehlt($(`.pp[data-i="${i}"]`), 'Bitte den Mangel beschreiben.');
    }
    const { mz } = zaehlen();
    if (mz && F.fb === null) return fehlt($('#fFb'), 'Bitte angeben, ob das Fahrzeug fahrbereit ist.');
    if (!F.best) return fehlt($('#fBestBox'), 'Bitte bestätigen, dass du die Kontrolle durchgeführt hast.');
    const btn = $('#fSenden'), text = t => { const b = $('b', btn); if (b) b.textContent = t; };
    btn.disabled = true; text('Speichert …');
    Ton.wecken();
    try {
      if (offeneMedien().length) { text('Lädt Fotos …'); await medienHochladenAlle(); text('Speichert …'); }
      const r = await api('kontrolleSpeichern', {
        kz: F.kz, art: F.art, modell: F.modell, km: F.km, bem: F.bem, bestaetigt: true, fahrbereit: mz ? F.fb : true,
        erg: S.cl.map(p => {
          const e = F.erg[p.k] || {};
          return { k: p.k, s: e.s || '', n: e.n || '', m: e.s === 'mangel' ? (F.medien[p.k] || []).filter(m => m.sid).map(m => m.sid) : [] };
        })
      });
      ls.del(entwurfKey());
      Object.keys(F.medien).forEach(k => F.medien[k].forEach(m => blobWeg(m.lid)));
      F = neuesFormular();
      S.meine = r.meine;
      renderMeine();
      erfolg(r.kurz);
      S.wartet = false;
      if (S.ich.admin && S.ad) adminLaden(true);
    } catch (e) {
      if (netzFehler(e)) {
        S.wartet = true;
        toast('Kein Netz. Die Kontrolle bleibt auf dem Handy und wird automatisch gespeichert, sobald wieder Netz da ist.', true);
      } else toast(fehlerText(e), true);
      if (btn.isConnected) { btn.disabled = false; text('Kontrolle speichern'); }
    }
  }

  /* Nach dem Speichern: Türen zu, Blinker, der Bus fährt ab */
  function erfolg(k) {
    toastWeg();
    S.flowFertig = true;
    const tel = S.einst.tel;
    const art = k.ok ? (k.mz ? 'gelb' : 'gut') : 'schlecht';
    vNeu.innerHTML = `
      <header class="fl-kopf"><div class="fl-in"><div class="fl-zeile"><div class="fl-titel"><small>${fDatum(k.ts)}, ${fZeit(k.ts)} Uhr</small><b>${k.ok ? 'Kontrolle gespeichert' : 'Gespeichert, nicht fahrbereit'}</b></div></div></div></header>
      <div class="fl-inhalt"><div class="abfahrt ${art}">
        <section class="halt">
          ${szeneHtml(bildVon(k) || 'solobus', k.ok ? 'offen' : '')}
          <div class="tafel"><div class="tf-kopf"><span>${esc(S.einst.firma || CFG.firma || 'Abfahrt')}</span><span class="tf-uhr" data-uhr></span></div>
            <div class="tf-zeile"><span>${esc(k.kz)}</span><span class="tf-wert">km ${fKm(k.km)}</span></div>
            ${k.mz ? `<div class="tf-zeile${k.ok ? '' : ' alarm'}"><span>Gemeldet</span><span class="tf-wert">${plural(k.mz, 'Mangel', 'Mängel')}</span></div>` : ''}
            <div class="tf-gross${k.ok ? '' : ' alarm'}" id="fRuf" role="status"></div>
          </div>
        </section>
        <section class="karte ab-blatt">
          <div class="zus-fz">${kzHtml(k.kz, true)}<div><b>${esc(k.mod || artName(k.art))}</b><small>km-Stand ${fKm(k.km)}</small></div></div>
          ${!k.ok ? `<div class="warnbox"><b>Fahrzeug nicht einsetzen.</b> Bitte sofort die Disposition informieren.${tel ? `<br><a href="tel:${esc(tel.replace(/[^\d+]/g, ''))}">${esc(tel)}</a>` : ''}</div>`
            : k.mz ? `<p class="ab-hinweis">${plural(k.mz, 'Mangel wurde', 'Mängel wurden')} gemeldet. Bitte zusätzlich kurz Bescheid geben.</p>` : '<p class="ab-hinweis gut">Alles in Ordnung. Das Fahrzeug ist fahrbereit.</p>'}
        </section>
        <button type="button" class="haupt breit" id="fFertig">Fertig</button>
        <p class="unter-los"><button type="button" class="link" data-id="${esc(k.id)}">Kontrolle ansehen</button></p>
      </div></div>`;
    uhr();
    const sz = $('.szene', vNeu), ruf = $('#fRuf');
    const rufen = t => { ruf.textContent = t; ruf.classList.remove('neu'); void ruf.offsetWidth; ruf.classList.add('neu'); };
    if (!k.ok) { sz.classList.add('warnt'); rufen('Nicht einsetzen'); Ton.spiel('warnung'); return; }
    Ton.spiel('abfahrt');
    if (RUHIG) { sz.classList.remove('offen'); rufen('Gute Fahrt!'); return; }
    const lauf = S.abLauf = {};
    const nach = (ms, fn) => setTimeout(() => { if (S.abLauf === lauf && sz.isConnected) fn(); }, ms);
    nach(430, () => sz.classList.remove('offen'));
    nach(1150, () => sz.classList.add('blinkt'));
    nach(1650, () => sz.classList.add('faehrt'));
    nach(1790, () => rufen('Gute Fahrt!'));
  }

  /* ---------- Verlauf: meine Kontrollen ---------- */
  function badge(k) {
    const beh = k.st.indexOf('behoben') === 0 ? '<span class="badge grau">behoben</span>' : '';
    if (!k.ok) return '<span class="badge rot">nicht fahrbereit</span>' + beh;
    if (k.mz) return `<span class="badge gelb">${plural(k.mz, 'Mangel', 'Mängel')}</span>` + beh;
    return '<span class="badge gruen">in Ordnung</span>';
  }
  const fzName = k => k.mod || artName(k.art);
  function zeileHtml(k, mitFahrer) {
    return `<button type="button" class="zeile" data-id="${esc(k.id)}">
      <span class="z-zeit"><b>${fDatum(k.ts)}</b><small>${fZeit(k.ts)} Uhr</small></span>
      <span class="z-kz">${kzHtml(k.kz)}${fzName(k) ? `<small>${esc(fzName(k))}</small>` : ''}</span>
      ${mitFahrer ? `<span class="z-fahrer">${esc(k.fahrer)}</span>` : ''}
      <span class="z-erg">${badge(k)}</span>
    </button>`;
  }
  function tagName(ts) {
    const t = tag(ts);
    if (t === tag(Date.now())) return 'Heute';
    if (t === tag(Date.now() - 864e5)) return 'Gestern';
    return new Date(ts).toLocaleDateString('de-DE', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' });
  }
  const tagKurz = ts => { const t = tag(ts); return t === tag(Date.now()) ? 'Heute' : t === tag(Date.now() - 864e5) ? 'Gestern' : fDatumKurz(ts); };
  function vzHtml(k, mitDatum) {
    const art = k.ok ? (k.mz ? 'gelb' : 'gut') : 'schlecht';
    return `<button type="button" class="vz ${art}" data-id="${esc(k.id)}">
      <span class="vz-zeit"><b>${fZeit(k.ts)}</b>${mitDatum ? `<small>${esc(tagKurz(k.ts))}</small>` : ''}</span>
      <span class="vz-fz">${kzHtml(k.kz)}${fzName(k) ? `<small>${esc(fzName(k))}</small>` : ''}</span>
      <span class="vz-erg">${badge(k)}</span>
    </button>`;
  }
  function renderMeine() {
    const el = $('#v-meine');
    if (!S.ich || S.ich.admin) return;
    if (!S.meine.length) { el.innerHTML = '<h2 class="titel">Verlauf</h2>' + leer('Du hast noch keine Abfahrtskontrolle gespeichert.'); return; }
    const tage = [];
    S.meine.forEach(k => { const t = tag(k.ts); let g = tage.find(x => x.t === t); if (!g) tage.push(g = { t, l: [] }); g.l.push(k); });
    el.innerHTML = '<h2 class="titel">Verlauf</h2>' + tage.map(g => `<h3 class="vtag">${esc(tagName(g.l[0].ts))}</h3><div class="vliste">${g.l.map(k => vzHtml(k, false)).join('')}</div>`).join('')
      + `<p class="mute klein">Deine letzten ${plural(S.meine.length, 'Abfahrtskontrolle', 'Abfahrtskontrollen')}.</p>`;
  }

  /* ---------- Detailansicht ---------- */
  function modalAuf(html) { toastWeg(); $('#mInhalt').classList.remove('ist-karte'); $('#mInhalt').innerHTML = html; $('#modal').hidden = false; document.body.style.overflow = 'hidden'; halten(); }
  function modalZu() { $('#modal').hidden = true; document.body.style.overflow = ''; S.detail = null; loslassen(); }
  async function detail(id) {
    modalAuf('<p class="laden">Lädt …</p>');
    try {
      const k = await api('kontrolleDetail', id);
      if ($('#modal').hidden) return;
      S.detail = k;
      $('#mInhalt').innerHTML = detailHtml(k);
      serverThumbsLaden($('#mInhalt'));
      const x = $('#mInhalt .x'); if (x) x.focus();
    } catch (e) {
      $('#mInhalt').innerHTML = `<p class="fehler">${esc(fehlerText(e))}</p><button type="button" class="haupt" data-zu>Schließen</button>`;
    }
  }
  function detailHtml(k) {
    const det = k.details || [];
    const reihe = [], gruppen = {};
    det.forEach(d => { if (!gruppen[d.b]) { gruppen[d.b] = []; reihe.push(d.b); } gruppen[d.b].push(d); });
    const maengel = det.filter(d => d.s === 'mangel');
    const art = k.ok ? (k.mz ? 'gelb' : 'gut') : 'schlecht';
    const NAME = { ok: 'OK', mangel: 'Mangel', na: 'entfällt' };
    return `<div class="m-kopf"><div>${kzHtml(k.kz, true)}<h2 id="mTitel">Abfahrtskontrolle</h2></div><div class="m-aktionen"><button type="button" class="mini druck" data-druck>Drucken</button><button type="button" class="x" data-zu aria-label="Schließen">×</button></div></div>
      <dl class="fakten"><div><dt>Datum</dt><dd>${fDatum(k.ts)}, ${fZeit(k.ts)}</dd></div><div><dt>Fahrer</dt><dd>${esc(k.fahrer)}</dd></div><div><dt>Fahrzeug</dt><dd>${esc(fzName(k) || '–')}</dd></div><div><dt>km-Stand</dt><dd>${fKm(k.km)}</dd></div></dl>
      <div class="ergebnis ${art}">${k.ok ? (k.mz ? 'Fahrbereit, mit geringfügigen Mängeln' : 'Fahrbereit – alles in Ordnung') : 'Nicht fahrbereit'}</div>
      ${maengel.length ? `<h3>Mängel</h3><ul class="mliste">${maengel.map(d => `<li><b>${esc(d.p)}</b><span>${esc(d.n)}</span>${d.m && d.m.length ? `<div class="thumbs">${d.m.map(serverThumb).join('')}</div>` : ''}</li>`).join('')}</ul>
        <p class="status">${k.st === 'offen' ? 'Status: offen' : esc(k.st.replace(/^behoben/, 'Behoben'))}</p>
        ${k.st === 'offen' && S.ich.admin ? `<button type="button" class="haupt" data-behoben="${esc(k.id)}">Mängel als behoben markieren</button>` : ''}` : ''}
      ${k.bem ? `<h3>Bemerkung</h3><p class="bem">${esc(k.bem)}</p>` : ''}
      <h3>Alle Prüfpunkte</h3>
      ${reihe.map(b => `<h4>${esc(b)}</h4><ul class="plist">${gruppen[b].map(d => `<li><span>${esc(d.p)}</span><span class="pill ${esc(d.s)}">${NAME[d.s] || '–'}</span></li>`).join('')}</ul>`).join('')}`;
  }

  async function behoben(id, btn) {
    btn.disabled = true; btn.textContent = 'Speichert …';
    try {
      const st = await api('mangelBehoben', id);
      const setzen = l => (l || []).forEach(k => { if (k.id === id) k.st = st; });
      setzen(S.meine);
      if (S.ad) { setzen(S.ad.kontrollen); S.ad.offen = S.ad.offen.filter(k => k.id !== id); }
      if (S.detail && S.detail.id === id) { S.detail.st = st; $('#mInhalt').innerHTML = detailHtml(S.detail); serverThumbsLaden($('#mInhalt')); }
      renderAdmin();
      toast('Als behoben markiert.');
    } catch (e) {
      toast(fehlerText(e), true);
      if (btn.isConnected) { btn.disabled = false; btn.textContent = 'Erneut versuchen'; }
    }
  }

  document.addEventListener('click', ev => {
    const mt = ev.target.closest('[data-mid]');
    if (mt) { serverZeigen(mt.dataset.mid, mt.dataset.typ); return; }
    if (ev.target === $('#modal')) return modalZu();
    const t = ev.target.closest('[data-zu],[data-druck],[data-behoben],[data-id]');
    if (!t) return;
    if (t.hasAttribute('data-zu')) return modalZu();
    if (t.hasAttribute('data-druck')) { try { window.print(); } catch (e) { } return; }
    if (t.dataset.behoben) return behoben(t.dataset.behoben, t);
    if (t.dataset.id && !t.disabled) detail(t.dataset.id);
  });
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && !$('#modal').hidden) modalZu(); });

  /* ---------- Admin ---------- */
  async function adminLaden(still) {
    const tage = S.fl.tage === 'alle' ? 0 : Math.max(31, S.fl.tage);
    const von = tage ? Date.now() - (tage + 1) * 864e5 : 0;
    try {
      S.ad = await api('adminDaten', von);
      if (S.ad.modelle) S.modelle = S.ad.modelle;
      S.adTage = tage || Infinity;
      renderAdmin();
    } catch (e) {
      toast(fehlerText(e), true);
      if (!S.ad && !still) $$('#v-uebersicht,#v-maengel,#v-fahrzeuge,#v-fahrer').forEach(el => { el.innerHTML = `<p class="fehler">${esc(fehlerText(e))}</p>`; });
    }
  }
  function renderAdmin() {
    if (!S.ad) return;
    renderUebersicht(); renderMaengel(); renderFahrzeuge(); renderFahrer(); uhr();
  }

  function renderUebersicht() {
    const A = S.ad, fl = S.fl, el = $('#v-uebersicht');
    const heute = tag(Date.now());
    let ks = A.kontrollen.filter(k => fl.tage === 1 ? tag(k.ts) === heute : fl.tage === 'alle' ? true : k.ts >= Date.now() - fl.tage * 864e5);
    if (fl.fid) ks = ks.filter(k => k.fid === fl.fid);
    if (fl.kz) ks = ks.filter(k => k.kz === fl.kz);
    if (fl.art) ks = ks.filter(k => k.art === fl.art);
    const basis = ks;
    if (fl.nurM) ks = ks.filter(k => k.mz > 0 || !k.ok);
    const mitM = basis.filter(k => k.mz > 0).length, nf = basis.filter(k => !k.ok).length;
    const heuteK = A.kontrollen.filter(k => tag(k.ts) === heute);
    const aktiv = A.fahrzeuge.filter(v => v.aktiv);
    const kzHeute = aktiv.map(v => v.kz);
    heuteK.forEach(k => { if (!kzHeute.includes(k.kz)) kzHeute.push(k.kz); });
    const geprueft = aktiv.filter(v => heuteK.some(k => k.kz === v.kz)).length;
    const kzAlle = A.fahrzeuge.map(v => v.kz);
    A.kontrollen.forEach(k => { if (!kzAlle.includes(k.kz)) kzAlle.push(k.kz); });
    S.auswahl = ks;
    const fsOffen = A.fahrer.filter(f => !f.admin && f.aktiv && f.fs && !f.fs.erledigt).length, nfHeute = heuteK.filter(k => !k.ok).length;
    const tafel = [['Heute kontrolliert', geprueft + ' von ' + aktiv.length, aktiv.length && geprueft === aktiv.length ? 'gut' : ''], ['Mängel offen', String(A.offen.length), A.offen.length ? '' : 'gut'], ['Führerschein offen', String(fsOffen), fsOffen ? '' : 'gut']];
    if (nfHeute) tafel.push(['Nicht fahrbereit', String(nfHeute), 'alarm']);
    const ZR = [[1, 'Heute'], [7, '7 Tage'], [30, '30 Tage'], [90, '90 Tage'], ['alle', 'Alle']];
    el.innerHTML = `
      <div class="kopfzeile"><h2 class="titel">Übersicht</h2><div class="aktionen"><button type="button" class="mini" id="adAkt">Aktualisieren</button><button type="button" class="mini" id="adCsv">Als Excel/CSV</button></div></div>
      ${tafelHtml(tafel, 'Leitstelle', 'frei')}
      <section class="karte">
        <div class="gr-kopf"><h2>Heute, ${fDatum(Date.now())}</h2><span class="gr-z${aktiv.length && geprueft === aktiv.length ? ' voll' : ''}">${geprueft} von ${aktiv.length} kontrolliert</span></div>
        ${kzHeute.length ? `<div class="heute">${kzHeute.map(kz => {
          const k = heuteK.find(x => x.kz === kz);
          return `<button type="button" class="hk ${k ? (k.ok ? (k.mz ? 'gelb' : 'gut') : 'schlecht') : 'offen'}"${k ? ` data-id="${esc(k.id)}"` : ' disabled'}>${kzHtml(kz)}<small>${k ? `${fZeit(k.ts)} Uhr, ${esc(k.fahrer)}${k.mz ? ', ' + plural(k.mz, 'Mangel', 'Mängel') : ''}` : 'noch keine Kontrolle'}</small></button>`;
        }).join('')}</div>` : '<p class="mute" style="margin:0">Noch keine Busse angelegt. Unter „Busse“ hinterlegst du eure Kennzeichen.</p>'}
      </section>
      <div class="filter">
        <div class="segf" role="group" aria-label="Zeitraum">${ZR.map(([v, t]) => `<button type="button" data-tage="${v}" aria-pressed="${String(fl.tage) === String(v)}">${t}</button>`).join('')}</div>
        <select id="flF" aria-label="Fahrer"><option value="">Alle Fahrer</option>${A.fahrer.map(f => `<option value="${esc(f.id)}"${fl.fid === f.id ? ' selected' : ''}>${esc(f.name)}</option>`).join('')}</select>
        <select id="flA" aria-label="Fahrzeugart"><option value="">Alle Fahrzeugarten</option>${Object.keys(ARTEN).map(a => `<option value="${a}"${fl.art === a ? ' selected' : ''}>${ARTEN[a]}</option>`).join('')}</select>
        <select id="flK" aria-label="Fahrzeug"><option value="">Alle Fahrzeuge</option>${kzAlle.map(kz => `<option value="${esc(kz)}"${fl.kz === kz ? ' selected' : ''}>${esc(kz)}</option>`).join('')}</select>
        <label class="check klein"><input type="checkbox" id="flM"${fl.nurM ? ' checked' : ''}><span>nur mit Mängeln</span></label>
      </div>
      <div class="zahlen">
        <div><b>${basis.length}</b><span>Kontrollen</span></div>
        <div class="${mitM ? 'w' : ''}"><b>${mitM}</b><span>mit Mängeln</span></div>
        <div class="${nf ? 'r' : ''}"><b>${nf}</b><span>nicht fahrbereit</span></div>
        <div class="${A.offen.length ? 'w' : ''}"><b>${A.offen.length}</b><span>Mängel offen</span></div>
      </div>
      ${ks.length ? `<div class="liste">${ks.slice(0, 300).map(k => zeileHtml(k, true)).join('')}</div>${ks.length > 300 ? `<p class="mute klein">Die neuesten 300 von ${ks.length} Kontrollen. Der Export enthält alle.</p>` : ''}` : leer('Keine Kontrollen für diese Auswahl.')}`;
  }
  function csvExport(liste) {
    if (!liste.length) return toast('Keine Kontrollen in dieser Auswahl.', true);
    const zelle = v => { v = String(v == null ? '' : v); if (/^[=+\-@]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; };
    const kopf = ['Datum', 'Uhrzeit', 'Fahrer', 'Kennzeichen', 'Fahrzeugart', 'Modell', 'km-Stand', 'Ergebnis', 'Mängel (Anzahl)', 'Mängel', 'Bemerkung', 'Mängelstatus'];
    const zeilen = liste.map(k => [fDatum(k.ts), fZeit(k.ts), k.fahrer, k.kz, artName(k.art), k.mod || '', k.km, k.ok ? 'fahrbereit' : 'NICHT fahrbereit', k.mz, k.mt.replace(/\n/g, ' | '), k.bem, k.st].map(zelle).join(';'));
    const blob = new Blob(['\ufeff' + [kopf.map(zelle).join(';')].concat(zeilen).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'abfahrtskontrollen-' + tag(Date.now()) + '.csv';
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    toast(plural(liste.length, 'Kontrolle', 'Kontrollen') + ' exportiert.');
  }
  const vUe = $('#v-uebersicht');
  vUe.addEventListener('click', ev => {
    const t = ev.target.closest('button');
    if (!t) return;
    if (t.id === 'adAkt') { t.disabled = true; t.textContent = 'Lädt …'; adminLaden(); return; }
    if (t.id === 'adCsv') { csvExport(S.auswahl || []); return; }
    if (t.dataset.tage) {
      const v = t.dataset.tage === 'alle' ? 'alle' : +t.dataset.tage;
      S.fl.tage = v;
      if ((v === 'alle' ? Infinity : v) > S.adTage) { t.textContent = 'Lädt …'; adminLaden(); } else renderUebersicht();
    }
  });
  vUe.addEventListener('change', ev => {
    const t = ev.target;
    if (t.id === 'flF') S.fl.fid = t.value;
    else if (t.id === 'flK') S.fl.kz = t.value;
    else if (t.id === 'flA') S.fl.art = t.value;
    else if (t.id === 'flM') S.fl.nurM = t.checked;
    else return;
    renderUebersicht();
  });

  function renderMaengel() {
    const A = S.ad;
    const z = $('#offenZahl');
    if (z) { z.textContent = A.offen.length; z.hidden = !A.offen.length; }
    $('#v-maengel').innerHTML = '<h2 class="titel">Offene Mängel</h2>' + (A.offen.length ? A.offen.map(k => `
      <section class="karte mangel">
        <div class="mk">${kzHtml(k.kz)}<span class="mk-info">${fDatum(k.ts)}, ${fZeit(k.ts)} Uhr, ${esc(k.fahrer)}</span>${!k.ok ? '<span class="badge rot">nicht fahrbereit</span>' : ''}</div>
        <ul class="mliste">${k.mt.split('\n').filter(Boolean).map(z => { const i = z.indexOf(' — '); return `<li><b>${esc(i > 0 ? z.slice(0, i) : z)}</b>${i > 0 ? `<span>${esc(z.slice(i + 3))}</span>` : ''}</li>`; }).join('')}</ul>
        <div class="aktionen"><button type="button" class="mini" data-id="${esc(k.id)}">Ganze Kontrolle</button><button type="button" class="haupt klein" data-behoben="${esc(k.id)}">Behoben</button></div>
      </section>`).join('') : leer('Keine offenen Mängel.'));
  }

  /* Busse: Kennzeichen anlegen und einem Modell zuordnen */
  const typName = t => { const m = modellVon(t); return m ? m.name : artName(t); };
  function typOptionen(gewaehlt, mitLeer) {
    return (mitLeer ? '<option value="">Bitte wählen</option>' : '') + Object.keys(ARTEN).map(a => {
      const ms = S.modelle.filter(m => m.art === a);
      return `<optgroup label="${ARTEN[a]}">${ms.map(m => `<option value="${esc(m.id)}"${gewaehlt === m.id ? ' selected' : ''}>${esc(m.name)}</option>`).join('')}<option value="${a}"${gewaehlt === a ? ' selected' : ''}>${ms.length ? (a === 'auto' ? 'Anderes Auto' : 'Anderer ' + ARTEN[a]) : ARTEN[a]}</option></optgroup>`;
    }).join('');
  }
  function renderFahrzeuge() {
    const A = S.ad;
    const ohneModell = S.modelle.length ? A.fahrzeuge.filter(v => v.aktiv && !v.modell && v.art !== 'auto' && S.modelle.some(m => m.art === v.art)).length : 0;
    $('#v-fahrzeuge').innerHTML = `<h2 class="titel">Busse</h2>
      <section class="karte"><h2>Bus hinzufügen</h2>
        <form id="fzForm" class="reihe" autocomplete="off">
          <label class="feld"><span>Kennzeichen</span><input id="fzKz" maxlength="15" autocapitalize="characters" spellcheck="false" placeholder="DU-AB 1234" required></label>
          <label class="feld"><span>Modell</span><select id="fzArt" required>${typOptionen('', true)}</select></label>
          <label class="feld"><span>Bezeichnung (optional)</span><input id="fzBez" maxlength="80" placeholder="z. B. Wagen 12, 50 Sitze"></label>
          <button class="haupt" type="button" data-absenden>Hinzufügen</button>
        </form>
        <p class="mute klein" style="margin-bottom:0">Der Fahrer tippt in der App zuerst das Modell an und dann das Kennzeichen. Die Modelle selbst ändert der WordPress-Administrator im Backend unter „Abfahrtskontrolle“.</p>
      </section>
      ${A.neueKz.length ? `<section class="karte"><h2>Von Fahrern eingetragen</h2><p class="mute" style="margin-top:-4px">Diese Kennzeichen wurden bei Kontrollen eingegeben, stehen aber noch nicht in der Liste.</p><div class="kzwahl">${A.neueKz.map(x => `<button type="button" class="kzbtn" data-fzneu="${esc(x.kz)}" data-typ="${esc(x.modell || x.art)}">${kzHtml(x.kz)}<small>${esc(typName(x.modell || x.art))}, in die Liste</small></button>`).join('')}</div></section>` : ''}
      <section class="karte"><h2>Liste</h2>
        ${ohneModell ? `<p class="hinweis">${plural(ohneModell, 'Bus hat', 'Busse haben')} noch kein Modell. Wähle es rechts neben dem Kennzeichen aus – dann finden die Fahrer das Kennzeichen direkt unter ihrem Modell.</p>` : ''}
        ${A.fahrzeuge.length ? Object.keys(ARTEN).map(a => { const l = A.fahrzeuge.filter(v => v.art === a); return l.length ? `<h3 class="fz-art">${ARTICON[a]}${ARTEN[a]} <span class="mute">(${l.length})</span></h3><ul class="tliste">${l.map(v => `<li class="${v.aktiv ? '' : 'aus'}">${kzHtml(v.kz)}<span class="t-bez">${v.bez ? esc(v.bez) : '<span class="mute">ohne Bezeichnung</span>'}</span><select class="fz-artwahl" data-fzart="${esc(v.kz)}" aria-label="Modell von ${esc(v.kz)}">${typOptionen(v.modell || v.art, false)}</select><span class="t-akt"><button type="button" class="mini" data-fzaktiv="${esc(v.kz)}" data-wert="${v.aktiv ? 0 : 1}">${v.aktiv ? 'Ausblenden' : 'Wieder anzeigen'}</button>${v.aktiv ? '' : `<button type="button" class="mini rot" data-fzloeschen="${esc(v.kz)}">Löschen</button>`}</span></li>`).join('')}</ul>` : ''; }).join('') : '<p class="mute" style="margin:0">Noch keine Busse.</p>'}
        <p class="mute klein">Ausgeblendete Busse stehen den Fahrern nicht mehr zur Auswahl und lassen sich danach löschen. Bisherige Kontrollen bleiben in beiden Fällen erhalten.</p>
      </section>`;
  }
  function fahrzeugeUebernehmen(liste) {
    S.ad.fahrzeuge = liste;
    const bekannt = liste.map(v => v.kz);
    S.ad.neueKz = S.ad.neueKz.filter(x => !bekannt.includes(x.kz));
    S.fz = liste.filter(v => v.aktiv).map(v => ({ kz: v.kz, bez: v.bez, art: v.art, modell: v.modell || '' }));
    if (!S.flowFertig && $('#fInhalt')) { typAbleiten(); renderTyp(); formAktualisieren(); }
    renderFahrzeuge(); renderUebersicht();
  }
  const vFz = $('#v-fahrzeuge');
  vFz.addEventListener('submit', async ev => {
    if (ev.target.id !== 'fzForm') return;
    ev.preventDefault();
    const kz = normKz($('#fzKz').value);
    if (!KZ_OK.test(kz)) return toast('Bitte ein gültiges Kennzeichen eingeben.', true);
    if (!$('#fzArt').value) return toast('Bitte das Modell wählen.', true);
    const btn = $('#fzForm .haupt'); btn.disabled = true;
    try { fahrzeugeUebernehmen(await api('fahrzeugSpeichern', kz, $('#fzBez').value, $('#fzArt').value)); toast(kz + ' hinzugefügt.'); }
    catch (e) { toast(fehlerText(e), true); if (btn.isConnected) btn.disabled = false; }
  });
  vFz.addEventListener('click', async ev => {
    const t = ev.target.closest('button');
    if (!t || (!t.dataset.fzneu && !t.dataset.fzaktiv && !t.dataset.fzloeschen)) return;
    if (t.dataset.fzloeschen && !nachfragen(t)) return;
    t.disabled = true;
    try {
      if (t.dataset.fzloeschen) { fahrzeugeUebernehmen(await api('fahrzeugLoeschen', t.dataset.fzloeschen)); toast(t.dataset.fzloeschen + ' gelöscht.'); }
      else if (t.dataset.fzneu) { fahrzeugeUebernehmen(await api('fahrzeugSpeichern', t.dataset.fzneu, '', t.dataset.typ || 'solobus')); toast(t.dataset.fzneu + ' hinzugefügt.'); }
      else fahrzeugeUebernehmen(await api('fahrzeugAktiv', t.dataset.fzaktiv, t.dataset.wert === '1'));
    } catch (e) { toast(fehlerText(e), true); if (t.isConnected) t.disabled = false; }
  });

  vFz.addEventListener('change', async ev => {
    const t = ev.target;
    if (!t.dataset.fzart) return;
    t.disabled = true;
    try { fahrzeugeUebernehmen(await api('fahrzeugSpeichern', t.dataset.fzart, '', t.value, true)); toast(t.dataset.fzart + ': ' + typName(t.value)); }
    catch (e) { toast(fehlerText(e), true); if (t.isConnected) t.disabled = false; }
  });

  function renderFahrer() {
    const A = S.ad;
    const fsAlle = A.fahrer.filter(f => !f.admin && f.aktiv && f.fs);
    const fsErl = fsAlle.filter(f => f.fs.erledigt).length, fsUeb = fsAlle.filter(f => f.fs.ueberfaellig).length;
    $('#v-fahrer').innerHTML = `<h2 class="titel">Fahrer und Zugänge</h2>
      ${fsAlle.length ? `<section class="karte"><div class="gr-kopf"><h2>Führerscheinkontrolle ${esc(fsAlle[0].fs.name)}</h2><span class="gr-z${fsErl === fsAlle.length ? ' voll' : ''}">${fsErl} von ${fsAlle.length} erledigt</span></div>
        ${fsUeb ? `<p class="fehler" style="margin:0">${plural(fsUeb, 'Fahrer ist', 'Fahrer sind')} überfällig. Die Disposition bekommt dazu eine E-Mail.</p>` : '<p class="mute" style="margin:0">Ab dem 1. des Monats werden die Fahrer in der App und per Benachrichtigung erinnert. Nach 7 Tagen ohne Kontrolle bekommt die Disposition eine E-Mail.</p>'}</section>` : ''}
      <section class="karte"><h2>App aufs Fahrer-Handy</h2>
        <div class="qr-in"><div class="qr" id="qrBox"></div>
          <ol class="schritte"><li>Fahrer scannt den Code mit der Handy-Kamera.</li><li><b>Android:</b> „Installieren“ antippen. <b>iPhone:</b> in Safari Teilen → „Zum Home-Bildschirm“.</li><li>App öffnen, mit Name und PIN anmelden.</li></ol></div>
        <div class="aktionen" style="margin-top:12px"><button type="button" class="mini" data-karte>Anleitung drucken</button><span class="mute klein">${esc(CFG.app)}</span></div>
      </section>
      <section class="karte"><h2>Fahrer anlegen</h2>
        <form id="frForm" class="reihe" autocomplete="off">
          <label class="feld"><span>Vor- und Nachname</span><input id="frName" maxlength="60" autocapitalize="words" required></label>
          <label class="feld"><span>PIN (leer = automatisch)</span><input id="frPin" inputmode="numeric" maxlength="8" placeholder="4 bis 8 Ziffern"></label>
          <button class="haupt" type="button" data-absenden>Anlegen</button>
        </form>
        <div id="frPinBox"></div>
      </section>
      <section class="karte"><h2>Zugänge</h2>
        <ul class="tliste">${A.fahrer.map(f => `<li class="${f.aktiv ? '' : 'aus'}">
          <span class="t-name"><b>${esc(f.name)}</b><small>${f.admin ? 'Admin, sieht alle Kontrollen' : 'Fahrer'}${f.letzte ? ', letzte Kontrolle ' + fDatum(f.letzte) : ''}${f.aktiv ? '' : ', gesperrt'}</small>${!f.admin && f.aktiv && f.fs ? fsBadge(f.fs) : ''}</span>
          ${f.admin ? '' : `<span class="t-akt"><button type="button" class="mini" data-fsfahrer="${esc(f.id)}">Führerschein</button><button type="button" class="mini" data-pin="${esc(f.id)}">Neue PIN</button><button type="button" class="mini" data-fraktiv="${esc(f.id)}" data-wert="${f.aktiv ? 0 : 1}">${f.aktiv ? 'Sperren' : 'Entsperren'}</button></span>`}
        </li>`).join('')}</ul>
        <p class="mute klein">Die beiden Admin-Zugänge ändert der WordPress-Administrator im Backend unter „Abfahrtskontrolle“.</p>
      </section>`;
    qrZeichnen($('#qrBox'), CFG.app);
  }
  function pinZeigen(name, pin) {
    const box = $('#frPinBox');
    box.innerHTML = `<div class="pinbox"><span>PIN für <b>${esc(name)}</b></span><strong>${esc(pin)}</strong><small>Bitte notieren und dem Fahrer geben. Er meldet sich mit genau diesem Namen und der PIN an.</small><button type="button" class="haupt klein" data-karte data-name="${esc(name)}" data-kpin="${esc(pin)}">Zugangskarte drucken</button></div>`;
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function nachfragen(t) {
    if (t.dataset.sicher) return true;
    const alt = t.textContent;
    t.dataset.sicher = '1'; t.textContent = 'Wirklich?';
    setTimeout(() => { if (t.isConnected) { delete t.dataset.sicher; t.textContent = alt; } }, 4000);
    return false;
  }
  const vFr = $('#v-fahrer');
  vFr.addEventListener('submit', async ev => {
    if (ev.target.id !== 'frForm') return;
    ev.preventDefault();
    const btn = $('#frForm .haupt'); btn.disabled = true;
    try {
      const r = await api('fahrerAnlegen', $('#frName').value, $('#frPin').value);
      await adminLaden(true);
      pinZeigen(r.name, r.pin);
    } catch (e) { toast(fehlerText(e), true); if (btn.isConnected) btn.disabled = false; }
  });
  vFr.addEventListener('click', async ev => {
    const t = ev.target.closest('button');
    if (t && t.dataset.fsfahrer) { fsFahrerZeigen(t.dataset.fsfahrer); return; }
    if (!t || (!t.dataset.pin && !t.dataset.fraktiv)) return;
    if ((t.dataset.pin || t.dataset.wert === '0') && !nachfragen(t)) return;
    t.disabled = true;
    try {
      if (t.dataset.pin) { const r = await api('fahrerPinNeu', t.dataset.pin); renderFahrer(); pinZeigen(r.name, r.pin); }
      else {
        const aktiv = t.dataset.wert === '1';
        await api('fahrerAktiv', t.dataset.fraktiv, aktiv);
        const f = S.ad.fahrer.find(x => x.id === t.dataset.fraktiv); if (f) f.aktiv = aktiv;
        renderFahrer(); toast(aktiv ? 'Zugang entsperrt.' : 'Zugang gesperrt.');
      }
    } catch (e) { toast(fehlerText(e), true); if (t.isConnected) t.disabled = false; }
  });

  /* ---------- Aufnahmen auf dem Handy zwischenspeichern ---------- */
  const SPEICHER = new Map();
  let idbDb = null;
  function idb() {
    if (idbDb) return Promise.resolve(idbDb);
    return new Promise((ok, no) => {
      try {
        const r = indexedDB.open('mak-medien', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('b');
        r.onsuccess = () => { idbDb = r.result; ok(idbDb); };
        r.onerror = () => no(r.error);
      } catch (e) { no(e); }
    });
  }
  function idbTx(modus, fn) {
    return idb().then(d => new Promise((ok, no) => {
      const t = d.transaction('b', modus); const q = fn(t.objectStore('b'));
      t.oncomplete = () => ok(q ? q.result : undefined); t.onerror = () => no(t.error);
    }));
  }
  async function blobSpeichern(lid, blob) { SPEICHER.set(lid, blob); try { await idbTx('readwrite', st => st.put(blob, lid)); } catch (e) { } }
  async function blobLaden(lid) { if (SPEICHER.has(lid)) return SPEICHER.get(lid); try { const b = await idbTx('readonly', st => st.get(lid)); if (b) SPEICHER.set(lid, b); return b || null; } catch (e) { return null; } }
  function blobWeg(lid) { SPEICHER.delete(lid); const u = lokaleUrls.get(lid); if (u) { URL.revokeObjectURL(u); lokaleUrls.delete(lid); } idbTx('readwrite', st => st.delete(lid)).catch(() => { }); }
  const lokaleUrls = new Map();
  async function lokaleUrl(lid) { if (lokaleUrls.has(lid)) return lokaleUrls.get(lid); const b = await blobLaden(lid); if (!b) return ''; const u = URL.createObjectURL(b); lokaleUrls.set(lid, u); return u; }

  /* ---------- Kamera in der App (keine Galerie) ---------- */
  function videoSekunden() {
    const max = S.maxUpload > 0 ? S.maxUpload : 8 * 1048576;
    return Math.max(5, Math.min(20, Math.floor(max * 0.85 * 8 / 1300000)));
  }
  function kamera(opt) {
    return new Promise(fertig => {
      const el = document.createElement('div');
      el.className = 'kam';
      el.innerHTML = `
        <div class="kam-kopf"><b>${esc(opt.titel)}</b><button type="button" class="kam-zu" data-k="zu">Abbrechen</button></div>
        <div class="kam-bild"><video playsinline muted autoplay></video>${opt.rahmen ? '<div class="kam-rahmen"><span>' + esc(opt.rahmen) + '</span></div>' : ''}<div class="kam-zeit" hidden></div><p class="kam-fehler" hidden></p></div>
        <div class="kam-leiste">
          <div class="kam-modus">${opt.video ? '<button type="button" data-k="foto" aria-pressed="true">Foto</button><button type="button" data-k="video" aria-pressed="false">Video</button>' : ''}</div>
          <button type="button" class="kam-ausl" data-k="los" aria-label="Aufnehmen"><span></span></button>
          <div class="kam-rechts"><button type="button" class="kam-wechsel" data-k="wechsel" aria-label="Kamera wechseln">${IC.wechsel}</button></div>
        </div>
        <div class="kam-vorschau" hidden><div class="kam-vbild"></div><div class="kam-vleiste"><button type="button" class="mini" data-k="nochmal">Nochmal</button><button type="button" class="haupt" data-k="ok">Verwenden</button></div></div>`;
      document.body.appendChild(el);
      document.body.style.overflow = 'hidden';
      halten();
      const video = $('video', el);
      const maxSek = videoSekunden();
      let stream = null, modus = 'foto', facing = 'environment', rec = null, teile = [], uhr = 0, sek = 0, ergebnis = null, url = '';
      const stop = () => { if (stream) stream.getTracks().forEach(t => t.stop()); stream = null; };
      const ende = r => {
        stop(); clearInterval(uhr);
        if (url) URL.revokeObjectURL(url);
        el.remove();
        document.body.style.overflow = $('#modal').hidden ? '' : 'hidden';
        loslassen();
        fertig(r);
      };
      const fehler = t => { const f = $('.kam-fehler', el); f.textContent = t; f.hidden = false; $('.kam-ausl', el).disabled = true; };
      async function starten() {
        stop();
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
          video.srcObject = stream;
          await video.play().catch(() => { });
          $('.kam-ausl', el).disabled = false; $('.kam-fehler', el).hidden = true;
        } catch (e) {
          fehler(e && (e.name === 'NotAllowedError' || e.name === 'SecurityError')
            ? 'Kein Zugriff auf die Kamera. Bitte in den Einstellungen des Handys die Kamera für diese App bzw. den Browser erlauben.'
            : 'Die Kamera konnte nicht gestartet werden.');
        }
      }
      const zeitText = () => `0:${String(sek).padStart(2, '0')} / 0:${String(maxSek).padStart(2, '0')}`;
      function foto() {
        const w = video.videoWidth, h = video.videoHeight;
        if (!w || !h) return;
        Ton.spiel('kamera');
        const f = Math.min(1, (opt.maxKante || 1600) / Math.max(w, h));
        const c = document.createElement('canvas');
        c.width = Math.round(w * f); c.height = Math.round(h * f);
        c.getContext('2d').drawImage(video, 0, 0, c.width, c.height);
        c.toBlob(b => { if (b) vorschau({ blob: b, typ: 'foto', mime: 'image/jpeg' }); }, 'image/jpeg', 0.85);
      }
      function videoStart() {
        const kandidaten = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
        const mime = window.MediaRecorder && MediaRecorder.isTypeSupported ? (kandidaten.find(m => MediaRecorder.isTypeSupported(m)) || '') : '';
        try { rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 1200000 } : { videoBitsPerSecond: 1200000 }); }
        catch (e) { toast('Video wird auf diesem Handy nicht unterstützt. Bitte ein Foto aufnehmen.', true); return; }
        teile = []; sek = 0;
        rec.ondataavailable = e => { if (e.data && e.data.size) teile.push(e.data); };
        rec.onstop = () => {
          const typ = String(rec.mimeType || mime || 'video/webm').split(';')[0];
          vorschau({ blob: new Blob(teile, { type: typ }), typ: 'video', mime: typ });
        };
        rec.start(1000);
        Ton.spiel('aufnahmeAn');
        el.classList.add('nimmt-auf');
        const z = $('.kam-zeit', el);
        z.hidden = false; z.textContent = zeitText();
        uhr = setInterval(() => { sek++; z.textContent = zeitText(); if (sek >= maxSek) videoStop(); }, 1000);
      }
      function videoStop() {
        clearInterval(uhr);
        el.classList.remove('nimmt-auf');
        $('.kam-zeit', el).hidden = true;
        if (rec && rec.state !== 'inactive') { rec.stop(); Ton.spiel('aufnahmeAus'); }
      }
      function vorschau(r) {
        ergebnis = r; url = URL.createObjectURL(r.blob);
        $('.kam-vbild', el).innerHTML = r.typ === 'video' ? `<video src="${url}" controls playsinline></video>` : `<img src="${url}" alt="Vorschau">`;
        $('.kam-vorschau', el).hidden = false;
      }
      function ersatz() {
        const inp = document.createElement('input');
        inp.type = 'file'; inp.accept = opt.video ? 'image/*,video/*' : 'image/*'; inp.setAttribute('capture', 'environment');
        fehler('Die Kamera lässt sich hier nicht direkt öffnen.');
        const f = $('.kam-fehler', el);
        f.insertAdjacentHTML('beforeend', '<br><button type="button" class="haupt klein" data-k="ersatz">Kamera des Handys öffnen</button>');
        inp.addEventListener('change', async () => {
          const d = inp.files && inp.files[0];
          if (!d) return;
          if (Date.now() - d.lastModified > 3 * 60000) { toast('Bitte direkt mit der Kamera aufnehmen. Bilder aus der Galerie sind nicht erlaubt.', true); return; }
          if (/^video\//.test(d.type)) return vorschau({ blob: d, typ: 'video', mime: d.type });
          try {
            const bmp = await createImageBitmap(d);
            const k = Math.min(1, (opt.maxKante || 1600) / Math.max(bmp.width, bmp.height));
            const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
            c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
            c.toBlob(b => vorschau({ blob: b, typ: 'foto', mime: 'image/jpeg' }), 'image/jpeg', 0.85);
          } catch (e) { vorschau({ blob: d, typ: 'foto', mime: d.type || 'image/jpeg' }); }
        });
        el._ersatz = inp;
      }
      el.addEventListener('click', ev => {
        const b = ev.target.closest('[data-k]');
        if (!b) return;
        const k = b.dataset.k;
        if (k === 'zu') { if (rec && rec.state === 'recording') { rec.onstop = null; rec.stop(); } ende(null); }
        else if (k === 'foto' || k === 'video') {
          if (rec && rec.state === 'recording') return;
          modus = k;
          $$('.kam-modus button', el).forEach(x => x.setAttribute('aria-pressed', String(x.dataset.k === k)));
          el.classList.toggle('modus-video', k === 'video');
        }
        else if (k === 'los') { if (modus === 'foto') foto(); else if (rec && rec.state === 'recording') videoStop(); else videoStart(); }
        else if (k === 'wechsel') { if (rec && rec.state === 'recording') return; facing = facing === 'environment' ? 'user' : 'environment'; starten(); }
        else if (k === 'nochmal') { URL.revokeObjectURL(url); url = ''; ergebnis = null; $('.kam-vorschau', el).hidden = true; $('.kam-vbild', el).innerHTML = ''; }
        else if (k === 'ok') { const r = ergebnis; ende(r); }
        else if (k === 'ersatz' && el._ersatz) el._ersatz.click();
      });
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) starten(); else ersatz();
    });
  }

  /* ---------- Fotos und Videos zu Mängeln ---------- */
  async function hochladen(zweck, blob, mime) {
    if (S.maxUpload && blob.size > S.maxUpload) throw new Error('Die Aufnahme ist zu groß für den Server. Bitte ein kürzeres Video aufnehmen.');
    const fd = new FormData();
    fd.append('action', 'mak'); fd.append('fn', 'medienHochladen'); fd.append('token', S.token || ''); fd.append('args', JSON.stringify([zweck]));
    const endung = { 'image/jpeg': 'jpg', 'image/png': 'png', 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov' }[mime] || 'bin';
    fd.append('datei', blob, 'aufnahme.' + endung);
    let res, j = null;
    try { res = await post(SERVER.url(), fd); }
    catch (e) { $('#offline').hidden = false; throw new Error('Keine Verbindung. Bitte Internet prüfen und erneut versuchen.'); }
    $('#offline').hidden = true;
    try { j = await res.json(); } catch (e) { }
    if (!j || typeof j !== 'object') throw new Error(res.status === 413 ? 'Die Aufnahme ist zu groß für den Server. Bitte ein kürzeres Video aufnehmen.' : 'Hochladen fehlgeschlagen (' + res.status + ').');
    if (!j.ok) {
      if (j.fehler === 'SITZUNG') { await login(true); return hochladen(zweck, blob, mime); }
      throw new Error(j.fehler || 'Hochladen fehlgeschlagen.');
    }
    return j.daten;
  }
  const offeneMedien = () => Object.keys(F.medien).filter(k => (F.erg[k] || {}).s === 'mangel').reduce((l, k) => l.concat(F.medien[k].filter(m => !m.sid && !m.fehlt)), []);
  let ladeLauf = null;
  function medienHochladenAlle(still) {
    if (!ladeLauf) {
      const form = F;
      ladeLauf = (async () => {
        try {
          for (const k of Object.keys(form.medien)) {
            if ((form.erg[k] || {}).s !== 'mangel') continue;
            for (const m of form.medien[k]) {
              if (m.sid || m.fehlt) continue;
              const b = await blobLaden(m.lid);
              if (!b) { m.fehlt = true; continue; }
              const r = await hochladen('schaden', b, m.mime);
              m.sid = r.id;
              if (form === F) { entwurfSpeichern(); const i = S.cl.findIndex(p => p.k === k); if (i >= 0) thumbsZeigen(i); }
            }
          }
        } finally { ladeLauf = null; }
      })();
    }
    const l = ladeLauf;
    if (still) l.catch(() => { });
    return l;
  }
  async function aufnehmen(i) {
    const k = S.cl[i].k;
    const r = await kamera({ titel: 'Mangel: ' + S.cl[i].p, video: true, maxKante: 1600 });
    if (!r) return;
    const lid = 'L' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    await blobSpeichern(lid, r.blob);
    (F.medien[k] || (F.medien[k] = [])).push({ lid, typ: r.typ, mime: r.mime, sid: '' });
    thumbsZeigen(i); aendern();
    medienHochladenAlle(true);
  }
  function medienWeg(lid) {
    Object.keys(F.medien).forEach(k => {
      const vorher = F.medien[k].length;
      F.medien[k] = F.medien[k].filter(m => m.lid !== lid);
      if (F.medien[k].length !== vorher) { const i = S.cl.findIndex(p => p.k === k); if (i >= 0) thumbsZeigen(i); }
    });
    blobWeg(lid); aendern();
  }
  async function thumbsZeigen(i) {
    const k = S.cl[i].k, box = $(`.pp[data-i="${i}"] .thumbs`);
    if (!box) return;
    const l = F.medien[k] || [];
    box.innerHTML = l.map(m => `<div class="thumb${m.sid ? '' : ' wartet'}"><button type="button" class="thumb-in" data-lid="${m.lid}" aria-label="${m.typ === 'video' ? 'Video' : 'Foto'} ansehen">${m.typ === 'video' ? '<span class="thumb-v">' + IC.play + '</span>' : '<img alt="">'}</button><button type="button" class="thumb-x" data-mweg="${m.lid}" aria-label="Aufnahme entfernen">×</button></div>`).join('');
    for (const m of l) {
      if (m.typ !== 'foto') continue;
      const u = await lokaleUrl(m.lid);
      const img = $(`[data-lid="${m.lid}"] img`, box);
      if (img && u) img.src = u;
    }
  }
  async function lokalZeigen(lid) {
    const m = Object.keys(F.medien).reduce((x, k) => x || F.medien[k].find(y => y.lid === lid), null);
    const u = await lokaleUrl(lid);
    if (m && u) betrachter(u, m.typ);
  }
  function betrachter(src, typ) {
    const v = document.createElement('div');
    v.className = 'betrachter';
    v.innerHTML = `<button type="button" class="betrachter-zu" aria-label="Schließen">×</button>${typ === 'video' ? `<video src="${src}" controls autoplay playsinline></video>` : `<img src="${src}" alt="">`}`;
    v.addEventListener('click', e => { if (e.target === v || e.target.closest('.betrachter-zu')) { v.remove(); loslassen(); } });
    document.body.appendChild(v);
    halten();
  }
  const serverUrls = new Map();
  async function serverUrl(mid) {
    if (serverUrls.has(mid)) return serverUrls.get(mid);
    const fd = new FormData();
    fd.append('action', 'mak_medium'); fd.append('token', S.token || ''); fd.append('mid', mid);
    const res = await post(SERVER.url(), fd);
    if (!res.ok) throw new Error('Aufnahme nicht verfügbar.');
    const u = URL.createObjectURL(await res.blob());
    serverUrls.set(mid, u);
    return u;
  }
  const serverThumb = m => `<button type="button" class="thumb thumb-in" data-mid="${esc(m.id)}" data-typ="${esc(m.typ)}" aria-label="${m.typ === 'video' ? 'Video' : 'Foto'} ansehen">${m.typ === 'video' ? '<span class="thumb-v">' + IC.play + '</span>' : '<img alt="">'}</button>`;
  async function serverThumbsLaden(root, grenze) {
    let n = 0;
    for (const el of $$('[data-mid]', root)) {
      if (el.dataset.typ === 'video' || el.dataset.geladen) continue;
      if (grenze && n >= grenze) break;
      n++;
      try { const u = await serverUrl(el.dataset.mid); const img = $('img', el); if (img) { img.src = u; el.dataset.geladen = '1'; } }
      catch (e) { el.classList.add('weg'); }
    }
  }
  async function serverZeigen(mid, typ) {
    try { betrachter(await serverUrl(mid), typ); } catch (e) { toast(fehlerText(e), true); }
  }

  /* ---------- Führerscheinkontrolle ---------- */
  const fDatumKurz = ts => new Date(ts).toLocaleDateString('de-DE', { timeZone: TZ, day: '2-digit', month: '2-digit' }).replace(/\.?$/, '.');
  function fsBadge(fs) {
    if (fs.erledigt) return `<span class="badge gruen">Führerschein ✓ ${fDatumKurz(fs.erledigt)}</span>`;
    if (fs.ueberfaellig) return `<span class="badge rot">Führerschein überfällig${fs.gemeldet ? ', Dispo informiert' : ''}</span>`;
    return `<span class="badge grau">Führerschein offen bis ${fDatumKurz(fs.bis)}</span>`;
  }
  function fsZahl() { const z = $('#fsZahl'); if (z) z.hidden = !(S.fs && !S.fs.erledigt); }
  function fsHinweisHtml() {
    const fs = S.fs;
    if (!fs || fs.erledigt || (S.ich && S.ich.admin)) return '';
    return `<section class="karte fs-hinweis${fs.ueberfaellig ? ' ueber' : ''}">
      <div class="fs-hinweis-t">${IC.ausweis}<div><b>Führerscheinkontrolle ${esc(fs.name)}</b><span>${fs.ueberfaellig ? 'Überfällig – bitte jetzt erledigen. Die Disposition wird informiert.' : 'Bitte Vorder- und Rückseite deines Führerscheins fotografieren – bis ' + fDatum(fs.bis) + '.'}</span></div></div>
      <button type="button" class="haupt klein" data-view="fs">Jetzt fotografieren</button>
    </section>`;
  }

  async function renderFs() {
    const el = $('#v-fs');
    if (!el || !S.ich || S.ich.admin) return;
    const fs = S.fs || {};
    const F2 = S.fsF;
    const seite = (key, titel) => `<div class="fs-seite">
        <div class="fs-bild">${F2[key] ? `<img src="${F2[key].url}" alt="${titel}">` : IC.ausweis}</div>
        <b>${titel}</b>
        <button type="button" class="${F2[key] ? 'mini' : 'haupt klein'}" data-fsfoto="${key}">${F2[key] ? 'Neu aufnehmen' : 'Fotografieren'}</button>
      </div>`;
    const offen = !fs.erledigt || S.fsNochmal;
    el.innerHTML = `<h2 class="titel">Führerschein</h2>
      ${tafelHtml([[fs.name || 'Diesen Monat', fs.erledigt ? 'erledigt' : fs.ueberfaellig ? 'überfällig' : 'noch offen', fs.erledigt ? 'gut' : fs.ueberfaellig ? 'alarm' : '']], 'Führerscheinkontrolle', 'frei')}
      <section class="karte fs-status ${fs.erledigt ? 'gut' : fs.ueberfaellig ? 'schlecht' : ''}">
        <div class="fs-hinweis-t">${fs.erledigt ? IC.ok : IC.ausweis}<div>
          <b>${fs.erledigt ? 'Für diesen Monat erledigt' : fs.ueberfaellig ? 'Bitte sofort erledigen' : 'Vorder- und Rückseite fotografieren'}</b>
          <span>${fs.erledigt ? 'Gesendet am ' + fDatum(fs.erledigt) + ', ' + fZeit(fs.erledigt) + ' Uhr. Danke!' : fs.ueberfaellig ? 'Die Frist ist abgelaufen. Die Disposition wird per E-Mail informiert.' : 'Einmal im Monat, bis ' + (fs.bis ? fDatum(fs.bis) : '') + '.'}</span>
        </div></div>
        ${fs.erledigt && !S.fsNochmal ? '<button type="button" class="link" data-fsnochmal>Fotos erneut aufnehmen</button>' : ''}
      </section>
      ${offen ? `<section class="karte">
        <h2>Fotos aufnehmen</h2>
        <p class="mute" style="margin-top:-6px">Nur mit der Kamera, gut lesbar, ohne Spiegelung. Die Fotos sehen nur du und die Disposition.</p>
        <div class="fs-seiten">${seite('vorne', 'Vorderseite')}${seite('hinten', 'Rückseite')}</div>
        <button type="button" class="haupt breit" data-fssenden${F2.vorne && F2.hinten ? '' : ' disabled'}>Führerscheinkontrolle absenden</button>
      </section>` : ''}
      <section class="karte" id="fsPush" hidden></section>
      <section class="karte"><h2>Bisherige Kontrollen</h2><div id="fsListe">${S.fsListe ? fsListeHtml(S.fsListe) : '<p class="laden" style="padding:12px 0">Lädt …</p>'}</div></section>`;
    pushKarte(); uhr();
    if (!S.fsListe) {
      try { S.fsListe = await api('fuehrerscheinListe'); const l = $('#fsListe'); if (l) l.innerHTML = fsListeHtml(S.fsListe); }
      catch (e) { const l = $('#fsListe'); if (l) l.innerHTML = `<p class="fehler">${esc(fehlerText(e))}</p>`; }
    }
  }
  function fsListeHtml(l) {
    return l.length ? `<ul class="fs-liste">${l.map(x => `<li><span><b>${esc(x.name)}</b><small>erledigt am ${fDatum(x.ts)}</small></span><span class="thumbs">${x.vorne ? serverThumb({ id: x.vorne, typ: 'foto' }) : ''}${x.hinten ? serverThumb({ id: x.hinten, typ: 'foto' }) : ''}${!x.vorne && !x.hinten ? '<small class="mute">Fotos nach Frist gelöscht</small>' : ''}</span></li>`).join('')}</ul>`
      : '<p class="mute" style="margin:0">Noch keine Führerscheinkontrolle gespeichert.</p>';
  }
  const vFs = $('#v-fs');
  vFs.addEventListener('click', async ev => {
    const t = ev.target.closest('button');
    if (!t) return;
    if (t.hasAttribute('data-fsnochmal')) { S.fsNochmal = true; renderFs(); return; }
    if (t.dataset.fsfoto) {
      const key = t.dataset.fsfoto;
      const r = await kamera({ titel: 'Führerschein ' + (key === 'vorne' ? 'Vorderseite' : 'Rückseite'), video: false, maxKante: 2000, rahmen: 'Führerschein in den Rahmen halten' });
      if (!r) return;
      if (S.fsF[key]) URL.revokeObjectURL(S.fsF[key].url);
      S.fsF[key] = { blob: r.blob, url: URL.createObjectURL(r.blob) };
      renderFs(); return;
    }
    if (t.hasAttribute('data-fssenden')) {
      t.disabled = true; t.textContent = 'Wird gesendet …';
      try {
        const v = await hochladen('fs_vorne', S.fsF.vorne.blob, 'image/jpeg');
        const h = await hochladen('fs_hinten', S.fsF.hinten.blob, 'image/jpeg');
        const r = await api('fuehrerscheinSpeichern', v.id, h.id);
        Object.keys(S.fsF).forEach(k => URL.revokeObjectURL(S.fsF[k].url));
        S.fsF = {}; S.fsNochmal = false;
        S.fs = r.status; S.fsListe = r.liste;
        fsZahl(); renderFs();
        Ton.spiel('halt');
        toast('Führerscheinkontrolle gesendet. Danke!');
      } catch (e) {
        toast(fehlerText(e), true);
        if (t.isConnected) { t.disabled = false; t.textContent = 'Führerscheinkontrolle absenden'; }
      }
      return;
    }
    if (t.hasAttribute('data-pushan')) { t.disabled = true; try { await pushEin(); toast('Erinnerungen sind eingeschaltet.'); } catch (e) { toast(fehlerText(e), true); } pushKarte(); return; }
    if (t.hasAttribute('data-pushaus')) { t.disabled = true; try { await pushAus(); toast('Erinnerungen ausgeschaltet.'); } catch (e) { toast(fehlerText(e), true); } pushKarte(); }
  });
  new MutationObserver(() => serverThumbsLaden(vFs, 4)).observe(vFs, { childList: true, subtree: true });

  async function fsFahrerZeigen(fid) {
    modalAuf('<p class="laden">Lädt …</p>');
    try {
      const r = await api('fuehrerscheinFahrer', fid);
      if ($('#modal').hidden) return;
      $('#mInhalt').innerHTML = `<div class="m-kopf"><div><h2 id="mTitel">Führerschein: ${esc(r.name)}</h2></div><div class="m-aktionen"><button type="button" class="x" data-zu aria-label="Schließen">×</button></div></div>
        <div style="margin:12px 0">${fsBadge(r.status)}</div>
        ${fsListeHtml(r.liste)}`;
      serverThumbsLaden($('#mInhalt'), 6);
    } catch (e) {
      $('#mInhalt').innerHTML = `<p class="fehler">${esc(fehlerText(e))}</p><button type="button" class="haupt" data-zu>Schließen</button>`;
    }
  }

  /* ---------- Erinnerungen aufs Handy (Push) ---------- */
  const pushGeht = () => !!(S.push && CFG.sw && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window);
  const b64zuBytes = b => { const p = '='.repeat((4 - b.length % 4) % 4); const r = atob((b + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(r, c => c.charCodeAt(0)); };
  async function pushAbo() {
    try { const reg = await navigator.serviceWorker.getRegistration(CFG.scope); return reg ? await reg.pushManager.getSubscription() : null; } catch (e) { return null; }
  }
  async function pushEin() {
    const erl = await Notification.requestPermission();
    if (erl !== 'granted') throw new Error('Benachrichtigungen wurden nicht erlaubt. Du kannst sie in den Einstellungen des Handys für diese App einschalten.');
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64zuBytes(S.push) });
    await api('pushAnmelden', sub.toJSON());
  }
  async function pushAus() {
    const sub = await pushAbo();
    if (sub) { await api('pushAbmelden', sub.endpoint); await sub.unsubscribe(); }
  }
  async function pushAbgleichen() {
    if (!pushGeht() || Notification.permission !== 'granted') return;
    const sub = await pushAbo();
    if (sub) api('pushAnmelden', sub.toJSON()).catch(() => { });
  }
  async function pushKarte() {
    const k = $('#fsPush');
    if (!k) return;
    if (IOS && !istApp()) {
      k.hidden = false;
      k.innerHTML = '<h2>Erinnerung aufs iPhone</h2><p class="mute" style="margin:0">Erinnerungen gibt es auf dem iPhone, sobald die App auf dem Home-Bildschirm installiert ist (Teilen → „Zum Home-Bildschirm“). Danach hier einschalten.</p>';
      return;
    }
    if (!pushGeht()) { k.hidden = true; return; }
    const an = Notification.permission === 'granted' && !!(await pushAbo());
    k.hidden = false;
    k.innerHTML = an
      ? '<h2>Erinnerung aufs Handy</h2><p class="mute" style="margin-top:-6px">Eingeschaltet – du bekommst Anfang des Monats eine Nachricht, falls die Kontrolle noch fehlt.</p><button type="button" class="mini" data-pushaus>Ausschalten</button>'
      : `<h2>Erinnerung aufs Handy</h2><p class="mute" style="margin-top:-6px">Bekomme Anfang des Monats eine Nachricht für die Führerscheinkontrolle.</p>${Notification.permission === 'denied' ? '<p class="fehler" style="margin:0">Benachrichtigungen sind für diese App gesperrt. Bitte in den Einstellungen des Handys erlauben.</p>' : '<button type="button" class="haupt klein" data-pushan>Erinnerungen einschalten</button>'}`;
  }

  /* ---------- Als App auf dem Handy ---------- */
  const istApp = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  const UA = navigator.userAgent || '';
  const IOS = /iPhone|iPad|iPod/i.test(UA) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const ANDROID = /Android/i.test(UA);
  const IC_TEILEN = '<svg class="teilen" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-label="Teilen-Symbol"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M7 10H6a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1h-1"/></svg>';
  let installEv = null;
  function installHtml() {
    if (istApp()) return '';
    if (installEv) return '<div class="inst-text"><b>Als App installieren</b><span>Dann liegt die Abfahrtskontrolle mit eigenem Symbol auf dem Startbildschirm.</span></div><button type="button" class="haupt klein" data-install>Installieren</button>';
    if (IOS) return `<div class="inst-text"><b>Als App aufs iPhone</b><span>In Safari unten auf ${IC_TEILEN} <b>Teilen</b> tippen, dann auf <b>„Zum Home-Bildschirm“</b>.</span></div>`;
    if (ANDROID) return '<div class="inst-text"><b>Als App installieren</b><span>Im Browser-Menü <b>⋮</b> auf <b>„App installieren“</b> oder <b>„Zum Startbildschirm hinzufügen“</b> tippen.</span></div>';
    return '';
  }
  function installZeigen() {
    const html = installHtml();
    const lg = $('#installLogin');
    if (lg) { lg.innerHTML = html; lg.hidden = !html; }
    const weg = Date.now() - Number(ls.get('mak_install_weg') || 0) < 14 * 864e5;
    const bn = $('#installBanner');
    if (bn) { bn.innerHTML = html ? html + '<button type="button" class="x klein-x" data-installweg aria-label="Hinweis ausblenden">×</button>' : ''; bn.hidden = !html || weg || !S.ich; }
    const pr = $('#installProfil');
    if (pr) { pr.innerHTML = html; pr.hidden = !html; }
  }
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEv = e; installZeigen(); });
  window.addEventListener('appinstalled', () => { installEv = null; installZeigen(); toast('App installiert – sie liegt jetzt auf dem Startbildschirm.'); });
  document.addEventListener('click', async ev => {
    const t = ev.target.closest('[data-install],[data-installweg]');
    if (!t) return;
    if (t.hasAttribute('data-installweg')) { ls.set('mak_install_weg', String(Date.now())); const bn = $('#installBanner'); if (bn) bn.hidden = true; return; }
    const e = installEv;
    if (!e) return;
    installEv = null;
    try { await e.prompt(); await e.userChoice; } catch (x) { }
    installZeigen();
  });
  function netz() {
    $('#offline').hidden = navigator.onLine !== false;
    if (navigator.onLine !== false && S.wartet && $('#fSenden')) { S.wartet = false; toast('Wieder online – speichere die Kontrolle …'); senden(); }
  }
  window.addEventListener('online', netz);
  window.addEventListener('offline', netz);
  if (CFG.sw && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => { navigator.serviceWorker.register(CFG.sw, { scope: CFG.scope }).catch(() => { }); });
  }

  /* ---------- QR-Code und Zugangskarte (Admins) ---------- */
  let qrLaden = null;
  function qrLib() {
    if (window.qrcode) return Promise.resolve(window.qrcode);
    if (!qrLaden) qrLaden = new Promise((ok, no) => {
      const sc = document.createElement('script');
      sc.src = CFG.qr; sc.onload = () => ok(window.qrcode); sc.onerror = () => { qrLaden = null; no(new Error('QR')); };
      document.head.appendChild(sc);
    });
    return qrLaden;
  }
  async function qrZeichnen(el, text) {
    if (!el) return;
    try { const q = (await qrLib())(0, 'M'); q.addData(text); q.make(); el.innerHTML = q.createSvgTag(4, 0); }
    catch (e) { el.innerHTML = '<span class="mute klein">QR-Code braucht Internet.</span>'; }
  }
  function zugangskarte(name, pin) {
    const leerz = '<span class="linie"></span>';
    const tel = S.einst.tel;
    modalAuf(`<div class="m-kopf"><h2 id="mTitel">Zugangskarte</h2><div class="m-aktionen"><button type="button" class="mini druck" data-druck>Drucken</button><button type="button" class="x" data-zu aria-label="Schließen">×</button></div></div>
      <div class="kd">
        <div class="kd-kopf"><img src="${esc(CFG.icon)}" width="56" height="56" alt=""><div><b>Abfahrtskontrolle</b><span>${esc(S.einst.firma || CFG.firma || '')}</span></div></div>
        <div class="kd-mitte">
          <div class="qr" id="kdQr"></div>
          <div class="kd-zugang"><p class="kd-label">Dein Zugang</p>
            <p>Name: ${name ? `<b>${esc(name)}</b>` : leerz}</p>
            <p>PIN: ${pin ? `<b class="kd-pin">${esc(pin)}</b>` : leerz}</p>
            <p class="mute klein">${esc(CFG.app)}</p></div>
        </div>
        <div class="kd-wege">
          <div><h3>Android</h3><ol><li>QR-Code mit der Kamera scannen und den Link öffnen.</li><li>„Installieren“ antippen – oder im Browser-Menü ⋮ „App installieren“.</li><li>App öffnen und mit Name und PIN anmelden.</li></ol></div>
          <div><h3>iPhone</h3><ol><li>QR-Code mit der Kamera scannen, Link in Safari öffnen.</li><li>Unten auf Teilen tippen, dann „Zum Home-Bildschirm“ und „Hinzufügen“.</li><li>App öffnen und mit Name und PIN anmelden.</li></ol></div>
        </div>
        <p class="kd-fuss">Vor jeder Fahrt: Abfahrtskontrolle in der App. PIN nicht weitergeben.${tel ? ' Disposition: ' + esc(tel) : ''}</p>
      </div>`);
    $('#mInhalt').classList.add('ist-karte');
    qrZeichnen($('#kdQr'), CFG.app);
  }
  vFr.addEventListener('click', ev => {
    const t = ev.target.closest('[data-karte]');
    if (t) zugangskarte(t.dataset.name || '', t.dataset.kpin || '');
  });

  /* ---------- Start der App: erst das Logo, dann geht es los ---------- */
  const splash = $('#splash');
  if (splash) {
    const dauer = RUHIG ? 900 : 2300;
    startBis = Date.now() + dauer;
    const weg = () => {
      if (!splash.isConnected || splash.classList.contains('weg')) return;
      splash.classList.add('weg'); startBis = 0;
      setTimeout(() => splash.remove(), 520);
    };
    splash.addEventListener('click', weg);
    setTimeout(weg, dauer);
  }
  if (window.MAK_TEST) window.MAK_TEST.app = { Ton, abmelden, zustand: () => S, formular: () => F };

  uhr();
  installZeigen();
  netz();
  if (CFG.extern) {
    /* App bei GitHub: zuerst die zuletzt bekannten Angaben nehmen; beim allerersten Start kurz nachsehen, wo die Webseite antwortet */
    try { konfigAnwenden(JSON.parse(ls.get('mak_konfig') || 'null')); } catch (e) { }
    konfigBereit = serverFinden();
    if (SERVER.gefunden()) laden();
    else konfigBereit.then(laden);

    /* Neue Fassung der App: Wer die App lange offen lässt, bekommt sie beim Zurückkommen – aber nur, wenn gerade nichts in Arbeit ist. */
    let geprueft = Date.now();
    const neueFassung = async () => {
      if (document.visibilityState !== 'visible' || navigator.onLine === false || !CFG.stand) return;
      if (Date.now() - geprueft < 10 * 60000) return;
      geprueft = Date.now();
      try {
        const v = await (await fetch('version.json?t=' + Date.now(), { cache: 'no-store' })).json();
        if (!v || v.app !== 'milo-abfahrtskontrolle' || !v.stand || v.stand === CFG.stand) return;
        let schon = '';
        try { schon = sessionStorage.getItem('mak_neu') || ''; } catch (e) { }
        if (schon === v.stand) return;                                   /* für diese Fassung wurde schon einmal neu geladen */
        /* nichts offen, keine Führerschein-Fotos in Arbeit, kein halb getipptes Passwort, nichts wartet aufs Speichern */
        const ruhig = !etwasOffen() && !Object.keys(S.fsF || {}).length && ($('#login').hidden || !$('#lgPin').value) && !S.wartet;
        if (!ruhig) { geprueft = 0; return; }                              /* beim nächsten Zurückkommen wieder nachsehen */
        try { sessionStorage.setItem('mak_neu', v.stand); } catch (e) { }
        location.reload();
      } catch (e) { }
    };
    document.addEventListener('visibilitychange', neueFassung);
    window.addEventListener('pageshow', neueFassung);
  } else laden();
}
