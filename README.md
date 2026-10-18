# Lucky Games

## О проекте

Клиентское приложение для слот-игр. Пользователь открывает обычную веб-страницу на React, выбирает слот-игру и переходит к ней.

## Архитектура

- **Маршрутизация** — React Router DOM для перехода между оболочкой приложения и слот-играми.
- **Оболочка приложения** — React-страница для выбора игры и перехода к ней.
- **Слот-игры** — отдельные 2D-игры на PixiJS 8, интегрированные в React.
- **Состояние** — MobX для управления состоянием приложения и игр.
- **Анимация** — PixiSpine и GSAP.
- **Аудио** — PixiSound.

## Структура проекта

```text
src/
├─ react/                  # React-клиент приложения
│  ├─ app/
│  │  ├─ components/       # компоненты оболочки
│  │  ├─ hooks/            # состояние темы и синхронизация документа
│  │  └─ i18n/
│  │     └─ locales/       # переводы по языкам
│  ├─ pages/
│  │  ├─ catalog/
│  │  │  ├─ components/    # блоки каталога и карточки игр
│  │  │  ├─ hooks/         # состояние и действия каталога
│  │  │  └─ model/         # данные и типы каталога
│  │  └─ game/             # React-обёртки страниц слот-игр
│  ├─ games/               # React-части конкретных игр
│  │  ├─ slot-one/
│  │  └─ slot-two/
│  ├─ shared/ui/
│  │  ├─ icons/            # общие SVG-иконки
│  │  ├─ site-header/
│  │  └─ site-footer/
│  ├─ styles/              # глобальные стили и тема
│  └─ main.tsx             # точка входа React
├─ games/
│  ├─ shared/              # общий код игр: pixi/ и network/
│  ├─ slot-one/
│  │  ├─ network/
│  │  ├─ domain/
│  │  ├─ stores/
│  │  ├─ ui/pixi/
│  │  └─ assets/
│  └─ slot-two/            # те же слои, что у slot-one
├─ assets/                 # общие статические ресурсы
└─ test/                   # настройка тестового окружения
```

Весь React-код находится в `src/react`: `app` отвечает за запуск и глобальные настройки, `pages` — за страницы, `games` — за React-обёртки конкретных игр, а `shared/ui` содержит общие компоненты интерфейса. Игровая логика, сети, состояние и PixiJS-сцены изолированы в `src/games`.

`slot-one` и `slot-two` — временные имена до выбора названий игр. Пока в папках есть только `.gitkeep`; реализация слоёв появится после уточнения игровых требований.

## Технологический стек

| Область               | Технологии                                          |
| --------------------- | --------------------------------------------------- |
| Клиентское приложение | React, TypeScript, Tailwind CSS                     |
| Маршрутизация         | React Router DOM                                    |
| 2D-графика игр        | PixiJS 8, @pixi/react                               |
| Анимация              | PixiSpine (`@esotericsoftware/spine-pixi-v8`), GSAP |
| Аудио                 | PixiSound (`@pixi/sound`)                           |
| Управление состоянием | MobX, mobx-react-lite                               |
| Сборка и dev-сервер   | Vite                                                |
| Тестирование          | Vitest, React Testing Library, Playwright           |
| Качество кода         | ESLint, Prettier                                    |
| Пакетный менеджер     | pnpm                                                |
| Git workflow и хуки   | Git Flow, Husky                                     |

Версию Spine runtime нужно согласовать с версией Spine Editor, из которой будут экспортированы игровые ассеты. Сейчас установлен runtime 4.3.x.

## Проверки и тестирование

- **Vitest** — unit-тесты, интеграционные тесты и тесты React-компонентов.
- **React Testing Library** — рендеринг компонентов и проверки взаимодействия с интерфейсом.
- **Playwright** — браузерные и скриншотные тесты.

Полезные команды:

```sh
pnpm dev              # запустить приложение локально
pnpm build            # собрать production-версию
pnpm test             # запустить Vitest в watch-режиме
pnpm test:run         # запустить Vitest один раз
pnpm test:e2e         # запустить Playwright в Chromium
pnpm test:e2e:update  # обновить скриншотные baseline-файлы
pnpm lint             # проверить код ESLint
pnpm format:check     # проверить форматирование Prettier
```

Для установки браузера Playwright после установки зависимостей:

```sh
pnpm exec playwright install chromium
```

## Git workflow

Для работы с ветками используется Git Flow. Husky запускает проверки ESLint и Prettier перед коммитом.
