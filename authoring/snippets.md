# Eval snippets — 10 realistic Norwegian course-text inputs

Written BEFORE any specs were generated, together with the rubric (expected
template + the properties a correct spec must have). Levels span 1T/R1/R2/S1.

## S1 (1T, derivasjon)
> Momentan vekstfart i et punkt er stigningstallet til tangenten i punktet.
> La elevene dra et punkt langs grafen til f(x) = x³ − 3x og se hvordan
> tangentens stigningstall varierer.

Rubric: `funksjon-tangent`; f = x³−3x; view shows both extrema (x=±1); no quiz.

## S2 (1T, likninger)
> Likningen x² = x + 2 kan løses grafisk: tegn y = x² og y = x + 2 i samme
> koordinatsystem og les av skjæringspunktene. Oppgave: dra punktet til et av
> skjæringspunktene.

Rubric: `likning-grafisk`; f = x², g = x+2; quiz with expr-zero on f−g
(x²−x−2, roots −1 og 2), tolerance sane (0.05–0.3); view includes both roots.

## S3 (1T, prosentvis vekst)
> En bil kjøpes for 350 000 kr og taper seg 12 % i verdi hvert år. Verdien er
> da V(t) = 350 000 · 0,88^t. Undersøk hvor lang tid det tar før verdien er
> halvert.

Rubric: `eksponentiell-vekst`; k = 0.88 < 1 (decay); b0 scaled sensibly (the
template slider caps b0 at 10 — expect the model to scale units, e.g. hundred
thousands: b0 = 3.5); xMax ≥ 6 (halveringstid ≈ 5,4 år må synes).

## S4 (R1, drøfting)
> Fortegnet til f′ forteller hvor f vokser og avtar. Vis grafene til
> f(x) = x³ − 3x² og den deriverte under hverandre, med felles x-verdi.

Rubric: `derivert-graf`; f = x³−3x²; view wide enough for x=0 og x=2
(ekstremalpunktene) og y-range som rommer f-minimum −4.

## S5 (R1, trigonometri)
> Enhetssirkelen definerer sinus og cosinus for alle vinkler. Oppgave: dra
> punktet til vinkelen 210° og se at sin 210° = −0,5.

Rubric: `enhetssirkel`; quiz value-near target 210 (tolerance 3–10 grader).

## S6 (R1, vektorer)
> Summen av to vektorer kan konstrueres med parallellogrammetoden. Utforsk
> u + v ved å dra vektorspissene.

Rubric: `vektorer`; op = "sum"; u, v ikke-parallelle.

## S7 (R2, integrasjon)
> Det bestemte integralet av f(x) = 4 − x² fra −2 til 2 er arealet mellom
> grafen og x-aksen. Utforsk hvordan arealet endrer seg med grensene.

Rubric: `areal-under-kurve`; f = 4−x²; from = −2, to = 2; viewY includes 4.

## S8 (R2, rekker)
> En geometrisk rekke med a₁ = 2 og k = 1/3 konvergerer. Delsummene nærmer seg
> S = a₁/(1−k) = 3. Vis hvordan Sₙ nærmer seg 3.

Rubric: `foelge-rekke`; an = 2·(1/3)^(n−1); kind = partial-sums; nMax ≥ 8.

## S9 (S1, sannsynlighet)
> Vi kaster en terning 12 ganger og teller antall seksere. Antall seksere er
> binomisk fordelt med n = 12 og p = 1/6. Hva er det mest sannsynlige antallet?

Rubric: `binomisk-fordeling`; n = 12; p ≈ 0.167.

## S10 (R2, trigonometriske funksjoner)
> Vannstanden i en havn kan modelleres med h(t) = 1,8·sin(0,5(t + 2)) + 2,5.
> Undersøk hva amplituden, perioden og likevektslinjen betyr for grafen.

Rubric: `trig-funksjon`; a = 1.8, b = 0.5, c = 2, d = 2.5.

---

**Honesty note on methodology**: snippets, rubric and specs are produced in the
same working session (the generator is Claude following `system-prompt.md`
alone; the rubric was frozen before generation). A stricter eval — a separate
model instance seeing only the system prompt, or Felix marking blind — is noted
as follow-up in EVAL.md.
