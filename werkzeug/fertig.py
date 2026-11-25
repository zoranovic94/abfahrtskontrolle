#!/usr/bin/env python3
"""Macht die App nach einer Änderung fertig zum Veröffentlichen.

Aufruf im Projektordner:   python3 werkzeug/fertig.py
Mit neuer Versionsnummer:  python3 werkzeug/fertig.py --version 1.6.0

Was hier passiert:
- app.css, app.js und js/qrcode.js bekommen in index.html eine neue Kennung (?v=…),
  damit jedes Handy die geänderte Datei wirklich neu lädt.
- sw.js bekommt die Liste der Programmdateien und einen neuen Namen für den Gerätespeicher.
- version.json wird neu geschrieben. Daran erkennt die offene App, dass es eine neuere
  Fassung gibt, und die Webseite (WordPress-Plugin), ob die App zu ihr passt.

Die Angaben dazu stehen an genau einer Stelle: in index.html bei „window.MAK = {…}“
(version, braucht, ajax, ajaxAlt). Mehrfaches Ausführen ändert nichts.
"""
import argparse, hashlib, json, pathlib, re

APP = 'milo-abfahrtskontrolle'


def fertig(ordner, version=None, braucht=None):
    o = pathlib.Path(ordner)
    kurz = lambda p: hashlib.sha256((o / p).read_bytes()).hexdigest()[:10]

    # 1) index.html: Kennungen der Programmdateien und die Einstellungen der App
    index = (o / 'index.html').read_text(encoding='utf-8')
    for datei in ('app.css', 'app.js', 'js/qrcode.js'):
        index, n = re.subn(re.escape(datei) + r'\?v=[0-9a-zA-Z@]*', datei + '?v=' + kurz(datei), index)
        assert n == 1, f'{datei}: in index.html {n}-mal gefunden, erwartet 1-mal'
    m = re.search(r'<script>window\.MAK = (\{.*?\});</script>', index, flags=re.S)
    assert m, 'window.MAK in index.html nicht gefunden'
    cfg = json.loads(m.group(1))
    if version:
        cfg['version'] = version
    if braucht:
        cfg['braucht'] = braucht
    for feld in ('ajax', 'ajaxAlt', 'version', 'braucht'):
        assert feld in cfg, f'window.MAK: {feld} fehlt'
    assert cfg['ajax'].startswith(('https://', 'http://localhost')), 'Die Adresse der Webseite muss mit https:// beginnen'

    # 2) Programmdateien, die das Handy für den Start ohne Netz vorhält
    dateien = [d + '?v=' + kurz(d) for d in ('app.css', 'app.js', 'js/qrcode.js')] + ['manifest.webmanifest']
    for unter in ('fonts', 'logo', 'icons'):
        dateien += [unter + '/' + f.name for f in sorted((o / unter).iterdir()) if f.suffix in ('.woff2', '.png')]

    # 3) Stand: Kennzahl über alles, was ausgeliefert wird (ohne die Stellen, an denen sie selbst steht)
    setze = lambda c: index[:m.start(1)] + json.dumps(c, ensure_ascii=False) + index[m.end(1):]
    sw = (o / 'sw.js').read_text(encoding='utf-8')
    kopf = re.compile(r'^const CACHE = .*;$', flags=re.M)
    assert len(kopf.findall(sw)) == 1, 'sw.js: Zeile „const CACHE = …;“ nicht eindeutig'
    h = hashlib.sha256()
    for d in dateien:
        h.update((o / d.split('?')[0]).read_bytes())
    h.update(setze(dict(cfg, stand='')).encode())
    h.update(kopf.sub('const CACHE = "", DATEIEN = [];', sw).encode())
    cfg['stand'] = h.hexdigest()[:10]

    # 4) schreiben
    (o / 'index.html').write_text(setze(cfg), encoding='utf-8')
    zeile = 'const CACHE = ' + json.dumps(f"mak-gh-{cfg['version']}-{cfg['stand']}") + ', DATEIEN = ' + json.dumps(dateien, ensure_ascii=False) + ';'
    (o / 'sw.js').write_text(kopf.sub(lambda _: zeile, sw), encoding='utf-8')
    (o / 'version.json').write_text(json.dumps({
        'app': APP, 'version': cfg['version'], 'braucht': cfg['braucht'], 'stand': cfg['stand'],
        'server': [cfg['ajax']] + list(cfg['ajaxAlt']),
    }, indent=1) + '\n', encoding='utf-8')
    return cfg, dateien


if __name__ == '__main__':
    a = argparse.ArgumentParser(description='Macht die App fertig zum Veröffentlichen.')
    a.add_argument('--ordner', default=str(pathlib.Path(__file__).resolve().parent.parent), help='Projektordner (Standard: der Ordner über werkzeug/)')
    a.add_argument('--version', help='neue Versionsnummer der App, z. B. 1.6.0')
    a.add_argument('--braucht', help='älteste Version des WordPress-Plugins, mit der die App zusammenarbeitet')
    w = a.parse_args()
    cfg, dateien = fertig(w.ordner, w.version, w.braucht)
    print(f"fertig: Version {cfg['version']} | Stand {cfg['stand']} | {len(dateien) + 1} Dateien für den Start ohne Netz | Webseite: {cfg['ajax']}")
