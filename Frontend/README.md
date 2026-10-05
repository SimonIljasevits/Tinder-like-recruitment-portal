| Saada CV tööandjale | swipe paremale | → |# Sobib — tööäpi prototüüp

Klikitav prototüüp Tinder-stiilis töövahendusele. Kasutaja seadistab korra oma
profiili (oskused, ligipääsetavuse vajadused, graafik, miinimumtasu) ja näeb
pärast seda **ainult neid tööpakkumisi, mis vastavad kõigile ta tingimustele
korraga**. Swipe paremale saadab eelkontrollitud profiili tööandjale ja avab
vestluse.

Prototüüp on mõeldud idee katsetamiseks ja näitamiseks, mitte tootmiskasutuseks.
Tagarakendust, kasutajakontosid ega andmebaasi siin ei ole — kõik andmed on
koodis näidisandmetena ja lehe värskendamine alustab otsast.

## Kuidas avada

Topeltklikk `index.html` peal avab selle brauseris ja äpp töötab.

Kui tahad arendada, käivita kohalik server, siis töötavad ka suhtelised teed
kindlasti korrektselt:

```bash
python -m http.server 8000
```

või PHP-ga, kui Pythonit pole:

```bash
php -S localhost:8000
```

Seejärel ava <http://localhost:8000>.

## Kolm vaadet, kõik samas koodis

Eraldi mobiili- ja arvutiversiooni ei ole. Paigutus kohandub ekraani laiusega
ja laial ekraanil saab lisaks käsitsi vaadet vahetada. Piir on **900 px**.

1. **Telefonivaade telefonis** — ava link telefonis. Üks veerg, kaardipakk,
   all ümmargused nupud ja navigatsioon. Kuulutus avaneb täisekraani vaatena.
2. **Arvutivaade** — üle 900 px, vaikimisi. Täisekraan, vasakul külgmenüü,
   keskel kaardipakk (kuni 440 px), paremal püsiv paneel, kus on alati peal
   oleva töö terve kuulutus. Eraldi kuulutusevaadet ei avane, sest info on
   juba ekraanil.
3. **Telefonivaade arvutis** — päises olev lüliti (monitori ja telefoni
   ikoon, nähtav ainult üle 900 px) paneb äpi telefoniraami keset lehte.
   Sees kehtivad täpselt samad reeglid mis päris telefonis. Mõeldud
   esitlemiseks, kui tahad arvutiekraanil näidata, kuidas asi telefonis välja
   näeb. Valik jääb meelde (`localStorage`).

### Vaate valimine lingiga

Vaate saab ette anda ka aadressiga, nii et esitlusel on olemas kolm valmis linki:

```
index.html            kohandub ise (telefonis telefon, arvutis arvuti)
index.html#arvuti     sunnib arvutivaate
index.html#telefon    sunnib telefonivaate (arvutis raamis)
```

Telefonis annavad kõik kolm sama tulemuse, sest ekraan on niikuinii kitsas.

### Telefonis vaatamine arendamise ajal

Käivita server nii, et see kuulab ka kohtvõrku, ja ava arvuti IP telefonist
(sama WiFi):

```bash
php -S 0.0.0.0:8080
```

Tehniliselt: `.shell` saab klassi `web` või `framed`. Kõik arvutivaate reeglid
failis `css/styles.css` nõuavad eesliidet `.shell.web`, nii et raamis jäävad
need lihtsalt kehtima panemata ja alles jääb telefoni paigutus. Sama kontrolli
teeb JS-is `deskVisible()`, mis otsustab, kas kõrvalpaneel on kasutusel.

Päris seadmete testimiseks kasuta brauseri arendajatööriistade seadmevaadet
(F12 → seadme ikoon), mitte akna kitsaks lohistamist.

## Failid

```
index.html         lehe karkass ja kogu HTML-märgend
css/styles.css     kõik stiilid, sh mõlema vaate paigutus ja tume režiim
js/i18n.js         tõlked (T) ja siltide sõnastik (TAGS)
js/data.js         tööpakkumised (JOBS) ja kuulutuste täistekstid (DETAILS)
js/app.js          olek, sobivusloogika, kaardipakk, swipe, vaated, sündmused
build.sh           ehitab allikatest ühe iseseisva faili
dist/              build.sh väljund (üks HTML-fail, kõik sees)
```

Teeke ei kasutata. Ainus väline sõltuvus on Google Fonts; ilma internetita
laeb leht varufontidega.

## Kandideerimise voog

Swipe paremale **ei ava vestlust**. See saadab tööandjale CV:

1. Küsimus: „Saadame CV?" — valikud **Jah, saada praegune** ja
   **Muuda enne saatmist**.
2. „Jah" → CV-st tehakse PDF ja see saadetakse tööandjale.
3. „Muuda" → avaneb CV toimeti. Üleval on meeldetuletus, mida see konkreetne
   tööandja ootab, et taotlust saaks selle töö järgi kohandada. Nupp „Saada
   PDF-ina" lõpetab sama moodi.
4. Töö läheb vahekaardile **Vestlused**, sektsiooni „Ootavad tööandjat".

**Vestlus avaneb alles siis, kui tööandja omalt poolt samamoodi vastab.**
Tööotsija ise vestlust alustada ei saa. Vahekaart on kogu aeg avatav ja
näitab lihtsalt, et vestlusi veel pole.

Tööandja vaadet veel ei ole — see tuleb hiljem. Kuni selleni on igal ootaval
kandideerimisel nupp **„Demo: vasta tööandjana"**, mis simuleerib tööandja
paremale-swipe'i ja avab vestluse. Nupp on märgistatud demona ja kaob ära,
kui päris tööandja pool valmis saab.

### Mis on jäljendatud

PDF-i tegemine ja saatmine on prototüübis **jäljendatud**: funktsioon
`sendCV()` failis `js/app.js` ootab hetke, koostab failinime
(`CV_Kadri_Lepik_Arikliendi_ookoristaja.pdf`) ja salvestab CV koopia
`S.sent` objekti. Päris versioonis käiks siit väljakutse tagarakendusse, mis
genereerib PDF-i ja edastab selle tööandjale. Saadetud CV jääb alles ja seda
saab kandideerimiste loendist uuesti vaadata — see osa on päris.

Kasutaja CV näidisandmed on `js/data.js` lõpus, objekt `CV`.

## Kuidas tüüpilisi asju muuta

**Uus tööpakkumine** — `js/data.js`, lisa kirje `JOBS` massiivi ja sama
`id`-ga plokk `DETAILS` objekti. Mõlemad on vaja, muidu jääb kuulutuse
täisvaade tühjaks. Välja `skill`, `shifts` ja `accom` väärtused peavad olema
`TAGS` võtmed failist `js/i18n.js`.

**Uus silt** (oskus, ligipääsetavuse tingimus, vahetus) — `js/i18n.js`,
`TAGS` objekt. Väli `g` ütleb, millisesse seadistuse sammu silt kuulub:
`skills`, `access` või `sched`.

**Tekstid ja tõlked** — `js/i18n.js`, objekt `T`. Iga võti on olemas nii
`et` kui `en` all; kui lisad uue, lisa mõlemasse, muidu jääb keelt vahetades
tühi koht.

**Värvid ja fondid** — `css/styles.css` algus, `:root` plokk. Tumeda režiimi
väärtused on kahes järgnevas plokis ja neid tuleb muuta koos, muidu läheb
üks režiim loetamatuks.

**Sobivusloogika** — `js/app.js`, funktsioon `fits(job, p)`. See on idee
tuum: oskus peab olema profiilis, töö peab katma *kõik* kasutaja
ligipääsetavuse vajadused, vähemalt üks vahetus peab kattuma ja tasu peab
olema vähemalt miinimum.

**Fotod** — praegu genereerib `photoBG()` failis `js/app.js` värvitausta ja
kaardil on märge „näidisfoto". Päris piltide jaoks asenda see funktsioon
pilditeega ja lisa `JOBS` kirjetesse pildiväli.

## Ühe faili ehitamine

Claude'i artifact ja lohista-ja-lase-lahti hostingud tahavad üht faili:

```bash
bash build.sh
```

Tulemus on `dist/sobib-prototuup.html` — CSS ja JS on sisse kirjutatud.
**Muudatused tee alati allikafailides**, mitte `dist/` sees; järgmine build
kirjutab selle üle.

## Avalikku võrku panemine

Staatiline leht, serverit ei vaja. Töötab GitHub Pages'is (Settings → Pages →
haru ja juurkaust), Netlify's, Zone.ee-s või ükskõik millisel veebimajutusel.
Kui paned GitHub Pages'i, läheb avalehena käiku `index.html` ja eraldi
ehitamist vaja ei ole.

## Klahvid ja žestid

| Tegevus | Žest | Klahv |
|---|---|---|
| Jäta vahele | swipe vasakule | ← |
| Sobib, ava vestlus | swipe paremale | → |
| Salvesta hiljemaks | swipe üles | ↑ |
| Ava terve kuulutus | puuduta pealkirja või ⓘ | Enter |
| Järgmine foto | puuduta fotot | — |
| Võta tagasi | — | nupp „Tagasi" |

## Tagarakenduse ehitajale

Esikülg on praegu täielikult iseseisev: andmed on koodis ja olek elab mälus.
Siin on see, mida tagarakendus peaks pakkuma, ja kohad, kus praegu on
jäljendus.

### Olemid

| Olem | Väljad | Kus praegu |
|---|---|---|
| `JobSeeker` | profiil: oskused, ligipääsetavuse vajadused, graafik, min. tunnitasu | `S.profile`, `js/app.js` |
| `CV` | nimi, kontaktid, kokkuvõte, töökogemuse kirjed, oskused, saadavus, tingimused | `CV`, `js/data.js` |
| `Job` | tööandja, ametinimetus, tasu, kaugus, vahetused, nõuded, kinnitatud tingimused | `JOBS`, `js/data.js` |
| `JobDetail` | kirjeldus, tööaeg, asukoht, alustamine, pakkumised | `DETAILS`, `js/data.js` |
| `Application` | tööotsija + töö + saadetud CV koopia + aeg + kas kohandatud | `S.sent`, `js/app.js` |
| `Match` | tekib, kui MÕLEMAD pooled on paremale swipe'inud | `S.matched` |
| `Message` | match'i sees, mõlemas suunas | `S.threads` |

Oluline: `Application` ja `Match` on **eri asjad**. Kandideerimine tekib
tööotsija swipe'ist, match alles siis, kui tööandja vastab. Vestlus kuulub
match'i, mitte kandideerimise külge.

### Mida esikülg tagarakenduselt ootaks

```
GET  /jobs?profile=...        → ainult 100% vasted, filtreerimine serveris
GET  /jobs/{id}               → kuulutuse täistekst
GET  /me/cv                   → kasutaja CV
PUT  /me/cv                   → CV muutmine
POST /applications            → {jobId, cv} → genereerib PDF-i ja saadab
GET  /applications            → kandideerimised ja nende staatus
POST /jobs/{id}/save          → salvesta hiljemaks
GET  /matches                 → match'id, mille taga on vestlus
GET  /matches/{id}/messages   → vestluse sõnumid
POST /matches/{id}/messages   → saada sõnum
```

Sobivusloogika tasub tõsta serverisse, sest praegu saadetakse kliendile kõik
tööd ja filtreeritakse brauseris — päris süsteemis ei tohiks kasutaja näha
pakkumisi, mis talle ei vasta. Praegune reegel on funktsioonis `fits()`
failis `js/app.js` ja seda saab ühe ühe-ühele tõlkega serverisse viia.

### Kohad, kus on jäljendus

| Mis | Fail | Funktsioon |
|---|---|---|
| PDF-i tegemine ja CV saatmine | `js/app.js` | `sendCV()` |
| Tööandja vastus (kuni tööandja vaadet pole) | `js/app.js` | `employerMatch()` |
| Tööandja vastussõnumid vestluses | `js/app.js` | `send()` |
| Tööpakkumised ja kuulutused | `js/data.js` | `JOBS`, `DETAILS` |
| Kasutaja CV | `js/data.js` | `CV` |

Kõik muu — filtreerimine, swipe, CV muutmine, saadetud CV säilitamine,
kandideerimiste ja vestluste eristamine — on päris ja töötab.

## Mis on teadlikult tegemata

- Tagarakendus, autentimine, päris andmebaas (kavandatud: Python/C# + Angular)
- Tööandja pool — praegu on ainult töötaja vaade
- Päris sõnumivahetus; vestluses vastab tööandja etteantud ridadega
- Asukohapõhine otsing; kaugused on andmetes fikseeritud
