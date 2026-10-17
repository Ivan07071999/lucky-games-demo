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
├─ app/                    # корневая оболочка и маршрутизация
├─ pages/
│  ├─ catalog/             # выбор игры
│  └─ game/                # страница выбранной игры
├─ games/
│  ├─ shared/              # общий код игр: pixi/ и network/
│  ├─ slot-one/
│  │  ├─ network/
│  │  ├─ domain/
│  │  ├─ stores/
│  │  ├─ ui/react/
│  │  ├─ ui/pixi/
│  │  └─ assets/
│  └─ slot-two/            # те же слои, что у slot-one
└─ shared/ui/              # общие React-компоненты приложения
```

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
