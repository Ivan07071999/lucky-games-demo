# Контракт слота v1

Типы для клиента и сервера находятся в [`src/index.ts`](src/index.ts). Текущая версия относится к демо-слоту `egypt-slot`; правила выплат заданы сервером. Все суммы баланса, ставок и выигрышей передаются **целыми игровыми монетами**. `coinValueCents` — денежный номинал одной монеты в центах, также целое число. Например, `coinValueCents: 2` означает 0,02 денежной единицы. Сервер списывает `bet × level` игровых монет.

## HTTP

| Запрос                               | Успешный ответ | Назначение                                             |
| ------------------------------------ | -------------- | ------------------------------------------------------ |
| `POST /api/slot/session` с JSON `{}` | `SlotState`    | Создать сессию с начальным балансом                    |
| `GET /api/slot/state`                | `SlotState`    | Восстановить баланс и бонусное состояние               |
| `GET /api/slot/rounds/:requestId`    | `RoundResult`  | Получить сохранённый результат после обрыва соединения |

Для двух `GET` требуется `Authorization: Bearer <sessionId>`. `SlotState.config` содержит разрешённые `bets`, `levels`, `coinValuesCents`, линии `paylines`, таблицу коэффициентов `payouts` (для 3/4/5 символов), множитель Wild и параметры Free Spins. Клиент показывает выплату в монетах как коэффициент × текущие `BET × LEVEL`; итог раунда рассчитывает сервер. `lastBet` равен `null` до первого вращения. `nextAction` равен `SPIN` или `FREE_SPIN`.

## WebSocket

`SPIN` accepts optional `spinMode: "CLASSIC" | "CASCADE" | "HYBRID"` (default: `CLASSIC`).
`CASCADE` and `HYBRID` use the same server-side cascade calculation from one paid spin and return
`RoundResult.cascade` with `initialReels` and up to 20 `steps`. `CASCADE` starts with falling
symbols; `HYBRID` first spins normal reels and lands on `initialReels`, then plays the shared
removal and refill steps. The server echoes `spinMode` in new `RoundResult` responses. The old
`cascade: true` request remains accepted for recovery of pending rounds.
Each step contains the evaluated `reels`, paid `wins`, unique `removedPositions`, `after` grid
and `payoutCoins`. All line wins from a stage are paid before their distinct symbols disappear;
remaining symbols fall within each reel and new symbols arrive from above. `RoundResult.reels`
is the final settled grid, `totalWinCoins` is the sum across all cascade steps, and `balance`
includes one bet deduction and the complete win. Free Spins trigger only when the final settled
grid has the required Scarabs. Cascade is available for paid spins; bonus spins retain the
classic reel rules. Pure Cascade cannot be combined with `anticipationDemo`; Hybrid can use it
while the regular reels are spinning. Its anticipation hint is calculated from `initialReels`.
Both modes change the slot's payout distribution.

`SPIN` accepts an optional `anticipationDemo: true` flag. This is a demo setting: the server
generates two visible `highScarab` symbols before reel 3, 4 or 5, then calculates the round
normally. The target reel and all later reels remain random, so Free Spins are not guaranteed.
This setting changes the symbol distribution and therefore the demo RTP. Omit the flag or send
`false` for the normal game math; it does not apply to `FREE_SPIN`.

В новых `RoundResult` сервер возвращает `presentation.anticipation`: `null` или подсказку `{ "reelIndex": 2 | 3 | 4, "extraSpinMs": 2400 }`. Индекс барабана начинается с нуля. Подсказка появляется, когда на уже остановившихся барабанах видны два `highScarab`, и не зависит от символов на ещё вращающихся барабанах. Она управляет только временем клиентской анимации; Quick Stop и Turbo пропускают задержку. Поле `presentation` необязательно для совместимости со старыми сохранёнными раундами.

В `ROUND_RESULT.result` сервер возвращает `winType` и `winMultiplier` для текущего раунда. Категория определяется по `totalWinCoins / bet.totalCoins`: `NO_WIN` при нулевом выигрыше, `NORMAL_WIN` при выигрыше меньше ×15, `BIG_WIN` от ×15, `MEGA_WIN` от ×50 и `SUPER_MEGA_WIN` от ×100. Для сравнения порогов сервер использует целые суммы монет без округления множителя. Эти поля необязательны в типе контракта, поскольку сохранённые до обновления раунды могут их не содержать.

В бесплатном вращении знаменателем служит ставка, сохранённая при запуске бонуса. На последнем Free Spin в `features.freeSpins.completion` дополнительно передаются `baseBetCoins`, суммарный `totalWinCoins`, `winMultiplier` и `winType` всего бонуса. Это часть обычного `ROUND_RESULT`; отдельное событие завершения бонуса не отправляется.

Подключение: `ws://127.0.0.1:3001/api/slot/ws` локально. На одно соединение отправляются JSON-команды:

```json
{
  "type": "SPIN",
  "sessionId": "<UUID>",
  "requestId": "spin_001",
  "bet": 15,
  "level": 1,
  "coinValueCents": 2
}
```

```json
{ "type": "FREE_SPIN", "sessionId": "<UUID>", "requestId": "free_001" }
```

Успешный ответ — `{ "type": "ROUND_RESULT", "requestId": "...", "result": RoundResult }`. Ошибка — `{ "type": "ERROR", "requestId": "..." | null, "code": SlotErrorCode, "message": "..." }`. Наборы `SlotErrorCode` и подсказок анимации `SlotAnimation` закрыты типами из `src/index.ts`. `requestId` состоит из 1–100 букв латиницы, цифр, `_` и `-`. Повтор команды с тем же ID в той же сессии возвращает прежний раунд; повтор с другим действием даёт `REQUEST_ID_CONFLICT`.

## Результат раунда

`RoundResult` всегда содержит `requestId`, `roundId`, `status: "completed"`, `mode`, `bet`, `balance`, `reels`, `wins`, `totalWinCoins`, `features`, `animations` и `nextAction`. `isWin` означает `totalWinCoins > 0`, а `netCoins` — выигрыш минус списанную ставку. В бонусном вращении ставка не списывается.

В `reels` ровно пять барабанов слева направо, в каждом ровно три символа сверху вниз. Символы обозначаются ключами ресурсов клиента, например `highAnkh`, `highScarab`, `wild`. `wins[].positions` содержит координаты `[reelIndex, rowIndex]` с нуля. `lineId` начинается с 1 и соответствует массиву `paylines` из `/state`. `wins[].payoutCoins` уже включает `multiplier`; клиент не пересчитывает выплату.

`balance.before` — баланс до раунда, `balance.afterBet` — после ставки, `balance.afterWin` — окончательный баланс. `features.wild` сообщает об расширенных и липких барабанах и множителях. `features.freeSpins` содержит число выданных и оставшихся бонусных вращений, а также накопленный бонусный выигрыш. `nextAction` указывает разрешённое следующее действие. `animations` задаёт порядок показа; сумма выигрыша от анимаций не зависит.

Клиенту нужно хранить `sessionId` для восстановления сессии и уникальный `requestId` до получения результата. При потере ответа он запрашивает сохранённый раунд по HTTP, затем синхронизирует `/state`.
