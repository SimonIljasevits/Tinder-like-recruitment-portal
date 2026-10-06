# Tööandja vaade

Sobib-prototüübi teine pool: tööandja sirvib kandidaate, kes on tema
kuulutustele kandideerinud. Sama swipe-loogika mis tööotsija poolel, aga
**paremale swipe teeb kohe match'i ja avab vestluse**, sest kandidaat on juba
omalt poolt paremale swipe'inud — tema CV on see, mis siin ekraanil on.

Juurkausta [README](../README.md) katab ülesehituse, vaated, build'i ja
tagarakenduse juhised; siin on ainult see, mis tööandja poolel teisiti on.

## Ava

Tavaline avamine: `tooandja/index.html`. Mõlema poole vahel saab liikuda
äpi sees — tööandja poolel „Ettevõte" vahekaardi alt, tööotsija poolel
„Profiil" vahekaardi alt.

Fail sõltub juurkausta omadest:

```
../css/styles.css    kõik põhistiilid
../js/i18n.js        TAGS — oskuste ja tingimuste sõnavara, ühine mõlemale poolele
```

Seetõttu ei tööta `tooandja/index.html` eraldi kaustast välja tõstetuna. Üks
iseseisev fail tuleb juurkaustas `bash build.sh` käsuga: `dist/sobib-tooandja.html`.

## Failid

```
index.html            märgend
css/tooandja.css      ainult erinevused: sinine aktsent, kuulutuste valija
js/i18n.js            tööandja tekstid (var T kirjutatakse üle)
js/data.js            EMPLOYER, POSTINGS, CANDIDATES
js/app.js             olek, pakk, swipe, CV vaade, match, vestlus
```

Aktsentvärv on **sinine**, tööotsija poolel ohutuskollane. See on tahtlik:
esitlusel on kohe näha, kumb pool ekraanil on.

## Mis siin teisiti on

| | Tööotsija | Tööandja |
|---|---|---|
| Kaardil on | tööpakkumine | kandidaat |
| ⓘ avab | kuulutuse täisteksti | kandidaadi CV |
| Swipe paremale | küsib CV saatmise kohta | teeb match'i ja avab vestluse |
| Swipe üles | salvestab töö hiljemaks | salvestab kandidaadi hiljemaks |
| Filter | profiili tingimused | milline kuulutus |

Kandidaadid on juba eelfiltreeritud: kaardile jõuavad ainult need, kes
vastavad kuulutuse tingimustele. Kaardil olev „100%" tähendab siin, et
kandidaat vastab kuulutuse nõuetele, mitte vastupidi.

## Uue kuulutuse lisamine

„Ettevõte" vahekaardil on nupp **Lisa uus kuulutus**. Vorm küsib ametinimetuse,
tunnitasu, asukoha, vahetused, ligipääsetavuse tingimused ja kuulutuse sisu.

**Ligipääsetavuse plokk on siin kogu asja mõte.** Neid andmeid ei ole üheski
tööportaalis — ei Töötukassal ega CV Keskusel — ja ainult tööandja saab need
kinnitada. Seetõttu näitab vorm kohe, **mitu juba süsteemis olevat kandidaati
sellele vastaks**, ja arv kasvab iga märgitud tingimusega:

```
0 → 1 → 2 → 3 → 5 → 6 → 8     (kui tingimusi ükshaaval juurde märkida)
```

See on tööandja motivatsioon: mida rohkem ta kinnitab, seda rohkem sobivaid
inimesi ta näeb. Ja just nii tekibki andmestik, mida mujal ei ole.

Avaldatud kuulutus läheb `S.added` sisse, ilmub filtririba ja ettevõtte
nimekirja ning muutub aktiivseks filtriks. Kandidaate sellel esialgu ei ole,
sest keegi pole veel jõudnud kandideerida — pakk näitab vastavat tühja seisundit.

Nõutud on ainult ametinimetus ja tunnitasu. Ingliskeelse nimetuse võib tühjaks
jätta, siis kasutatakse eestikeelset mõlemas keeles.

## Andmed

`CANDIDATES` failis `js/data.js` — kaheksa kandidaati, igaühel täielik CV
(kokkuvõte, töökogemus, oskused, saadavus, tingimused) nii eesti kui inglise
keeles, pluss millisele kuulutusele ta kandideeris ja kas CV oli kohandatud.

Esimene kandidaat on **Kadri Lepik** — sama inimene, kelle CV-ga tööotsija
poolel kandideeritakse. Nii saab esitlusel terve ringi läbi käia: saadad
tööotsijana CV, lähed tööandja poolele ja näed sedasama kandideerimist.

Tööandja ise on `EMPLOYER`, tema kolm avatud kuulutust `POSTINGS`.

## Mis on jäljendatud

| Mis | Funktsioon |
|---|---|
| Kandidaadi vastused vestluses | `send()` |
| Kandidaatide nimekiri | `CANDIDATES`, `js/data.js` |

Match'i loogika ise on päris selles mõttes, et tööandja „jah" ongi see, mis
vestluse avab. Päris süsteemis kontrolliks server, kas mõlemad pooled on
paremale swipe'inud; siin on kandidaadi pool eeldatavalt juba tehtud, sest
nimekirjas ongi ainult need, kes on kandideerinud.
