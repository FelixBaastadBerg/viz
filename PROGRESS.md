
## 2026-09-01 — Kapitteltest-systemet reparert ende til ende (runde 20)

Felix meldte at kapitteltester ikke var synlige. Rotårsaker funnet og fikset,
alle deployet og prod-verifisert:
1) Sidebar-omskrivingen mistet syntetiseringen av Kapitteltest-innslaget fra
   modul.test_active → gjenopprettet i CourseLayout (947e5da).
2) Sju Modul-spørringer brukte FK-en 'course' fjernet i migrasjon 0018 →
   alle progresjons-endepunkter har kastet 500 lenge (forklarer studentklagene
   på matte1). Fikset til courses= (atlas 542d32e), verifisert 500→200 lokalt
   og i prod.
3) Global editable=true ga ALLE innloggede forfatter-verktøylinjer + synlige
   løsningsforslag på testsider → default false, /administrer opter inn
   (f294631). Studentvisning verifisert lokalt og i prod.
Bonus: atlas fikk også bygg-først-deploy — databasen restartes ikke lenger
ved backend-deploys. Kjent kosmetisk rest: choice-rader sprer inline-KaTeX
med store mellomrom (space-between) — småfiks senere.

## 2026-09-01 — Choice-styling fikset (runde 21)

Rotårsak: global regel `div[data-node-view-wrapper] div {display/justify:
inherit}` lot svarradens flex space-between arve inn i selve svarteksten →
tekst + inline-KaTeX ble spredte flex-items. Fiks (be9b67b): svarinnholdet
pinnes til display:block via inline-style (slår den globale regelen), og
LatexInline-wrapperen ble <span> (korrekt inline-HTML, utenfor div-regelens
rekkevidde). Verifisert i prod: naturlig tekstflyt med inline-matte.
