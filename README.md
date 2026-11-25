# Abfahrtskontrolle Milo Reisen

App für die Fahrer von Milo Reisen: Abfahrtskontrolle der Busse und monatliche Führerscheinkontrolle.

Adresse der App: https://zoranovic94.github.io/abfahrtskontrolle/

## Was hier liegt und was nicht

Hier liegt nur das Programm der App (Oberfläche). Es sind keine Daten enthalten.

Kontrollen, Fotos, Führerscheinbilder und Zugänge liegen auf der Webseite von Milo Reisen. Dort läuft das
WordPress-Plugin „Milo Abfahrtskontrolle“ (ab Version 1.5.0) als Datenspeicher. Daten gibt es dort nur nach
Anmeldung mit Name und PIN: Fahrer sehen ihre eigenen Kontrollen, die zwei Admin-Zugänge alle. Aus einem Browser
heraus darf außer der Webseite selbst nur diese App-Adresse die Schnittstelle benutzen.

## Wie die App sich aktualisiert

GitHub veröffentlicht jede Änderung in diesem Projekt nach etwa einer Minute unter der Adresse oben.
Die App auf den Handys holt sich die neue Fassung beim nächsten Öffnen von selbst. Bleibt sie lange offen,
lädt sie die neue Fassung beim Zurückkommen, sofern gerade keine Kontrolle in Arbeit ist.

## Neue Version veröffentlichen

1. Dateien ändern (`app.js`, `app.css`, `index.html`, Bilder …).
2. `python3 werkzeug/fertig.py` ausführen. Das setzt die Kennungen in `index.html`, die Dateiliste in `sw.js`
   und schreibt `version.json` neu. Für eine neue Versionsnummer: `python3 werkzeug/fertig.py --version 1.6.0`.
3. Änderung hochladen (commit und push auf `main`).

Die Einstellungen der App stehen in `index.html` bei `window.MAK = {…}`:

- `ajax`, `ajaxAlt`: Adressen der Webseite, die die Daten speichert. Die App nimmt die erste, die antwortet.
- `version`: Version der App.
- `braucht`: älteste Version des WordPress-Plugins, mit der die App zusammenarbeitet. Die Webseite liest das aus
  `version.json` und nimmt ihre eingebaute App, falls ihr Plugin älter ist oder ihre Adresse hier nicht eingetragen ist.

`sw.js` sorgt dafür, dass die App auch ohne Netz startet. Er speichert nur Programmdateien, nie Daten.

## Fremde Bestandteile

Schriften: Barlow und Doto (SIL Open Font License, siehe `fonts/`). QR-Code: qrcode-generator (MIT).
