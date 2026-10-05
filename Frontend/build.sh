#!/usr/bin/env bash
# Ehitab allikafailidest ühe iseseisva HTML-faili: dist/sobib-prototuup.html
#
# Milleks: Claude'i artifact ja lohista-ja-lase-lahti hostingud (Netlify Drop jms)
# tahavad üht faili. Arendamiseks on mugavam hoida CSS ja JS eraldi, nii et
# muudatused tee ALATI allikafailides ja jooksuta seejärel see skript.
#
# Kasutus:   bash build.sh
set -euo pipefail
cd "$(dirname "$0")"

OUT="dist/sobib-prototuup.html"
mkdir -p dist

{
  # index.html kuni css/styles.css lingini (see asendatakse sisuga)
  sed -n '1,/<link rel="stylesheet" href="css\/styles.css">/p' index.html \
    | sed '$d'

  echo '<style>'
  cat css/styles.css
  echo '</style>'
  echo '</head>'
  echo '<body>'

  # markup: <body> ja esimese <script src> vahel
  sed -n '/^<body>$/,/^<script src="js\/i18n.js"><\/script>$/p' index.html \
    | sed '1d;$d'

  echo '<script>'
  cat js/i18n.js
  echo ''
  cat js/data.js
  echo ''
  cat js/app.js
  echo '</script>'
  echo '</body>'
  echo '</html>'
} > "$OUT"

echo "Valmis: $OUT ($(wc -c < "$OUT") baiti)"
