# BADK Simple

Простий веб-дашборд поверх публічного BADK Live.

## Що це

Проєкт автоматично відкриває https://mortisgames.github.io/badklive/, знімає публічно доступні дані й зберігає їх у `public/data/snapshot.json`. Веб-інтерфейс читає цей snapshot і показує його у спрощеному вигляді.

## Оновлення

GitHub Actions запускає збір даних за розкладом приблизно кожні 10 хвилин і комітить оновлений snapshot у репозиторій. GitHub Pages після цього перепубліковує сайт.

> GitHub cron не гарантує запуск рівно до секунди, тому інтервал слід сприймати як приблизно 10 хвилин.

## Локальний запуск

Потрібен Node.js 22+.

```bash
npm install
npx playwright install chromium
npm run scrape
npx serve public
```

## Структура

- `public/index.html` — сторінка дашборду
- `public/style.css` — оформлення
- `public/app.js` — відображення, пошук і фільтрація
- `public/data/snapshot.json` — останній знімок BADK Live
- `scripts/scrape.mjs` — збирач публічних даних
- `.github/workflows/update-data.yml` — автооновлення
- `.github/workflows/pages.yml` — публікація GitHub Pages

## Джерело

Оригінальний проєкт: https://mortisgames.github.io/badklive/

Цей репозиторій не є офіційною частиною BADK Live і лише спрощує перегляд публічно доступних даних.
