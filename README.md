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

## Технологический стек

| Область               | Технологии                                |
| --------------------- | ----------------------------------------- |
| Клиентское приложение | React, TypeScript, Tailwind CSS           |
| Маршрутизация         | React Router DOM                          |
| 2D-графика игр        | PixiJS 8, интеграция с React              |
| Анимация              | PixiSpine, GSAP                           |
| Аудио                 | PixiSound                                 |
| Управление состоянием | MobX                                      |
| Сборка и dev-сервер   | Vite                                      |
| Тестирование          | Vitest, React Testing Library, Playwright |
| Качество кода         | ESLint, Prettier                          |
| Пакетный менеджер     | pnpm                                      |
| Git workflow и хуки   | Git Flow, Husky                           |

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
