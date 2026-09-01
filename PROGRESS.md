
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
