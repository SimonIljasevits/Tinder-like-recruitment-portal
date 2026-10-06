#!/usr/bin/env bash
# Ehitab allikafailidest iseseisvad üksikfailid kausta dist/:
#   dist/sobib-prototuup.html   tööotsija vaade
#   dist/sobib-tooandja.html    tööandja vaade
#
# Milleks: Claude'i artifact ja lohista-ja-lase-lahti hostingud (Netlify Drop
# jms) tahavad üht faili. Arendamiseks on mugavam hoida CSS ja JS eraldi, nii
# et muudatused tee ALATI allikafailides ja jooksuta seejärel see skript.
#
# NB: tööotsija üksikfaili ei panda js/api.js sisse — see fail on mõeldud
# backendita vaatamiseks ja töötab näidisandmetega. Päris rakendus laeb
# api.js index.html kaudu.
#
# Kasutus:   bash build.sh
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p dist

# $1 = lehe tee, $2 = väljundfail, $3.. = CSS ja JS failid järjekorras
build() {
  local page="$1"; shift
  local out="$1"; shift

  {
    # Pea: kõik kuni esimese kohaliku stiililingini, lingid ise välja jäetud.
    # Google Fonts link jääb alles, see peab ka üksikfailis välja laadima.
    awk '
      /<link rel="stylesheet" href="[^"]*css\/[^"]*\.css">/ { exit }
      { print }
    ' "$page"

    echo '<style>'
    for f in "$@"; do
      case "$f" in *.css) cat "$f"; echo ;; esac
    done
    echo '</style>'
    echo '</head>'
    echo '<body>'

    # Märgend: <body> ja esimese skriptiviite vahel.
    awk '
      /^<body>$/ { inb = 1; next }
      /^<script src=/ { inb = 0 }
      inb { print }
    ' "$page"

    echo '<script>'
    for f in "$@"; do
      case "$f" in *.js) cat "$f"; echo ;; esac
    done
    echo '</script>'
    echo '</body>'
    echo '</html>'
  } > "$out"

  echo "Valmis: $out ($(wc -c < "$out") baiti)"
}

build index.html dist/sobib-prototuup.html \
  css/styles.css js/i18n.js js/data.js js/app.js

build tooandja/index.html dist/sobib-tooandja.html \
  css/styles.css tooandja/css/tooandja.css \
  js/i18n.js tooandja/js/i18n.js tooandja/js/data.js tooandja/js/app.js
