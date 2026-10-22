# Контракт слота v1

Типы для клиента и сервера находятся в [`src/index.ts`](src/index.ts). Текущая версия относится к демо-слоту `egypt-slot`; правила выплат заданы сервером. Все суммы баланса, ставок и выигрышей передаются **целыми игровыми монетами**. `coinValueCents` — денежный номинал одной монеты в центах, также целое число. Например, `coinValueCents: 2` означает 0,02 денежной единицы. Сервер списывает `bet × level` игровых монет.

## HTTP

| Запрос                               | Успешный ответ | Назначение                                             |
| ------------------------------------ | -------------- | ------------------------------------------------------ |
| `POST /api/slot/session` с JSON `{}` | `SlotState`    | Создать сессию с начальным балансом                    |
| `GET /api/slot/state`                | `SlotState`    | Восстановить баланс и бонусное состояние               |
| `GET /api/slot/rounds/:requestId`    | `RoundResult`  | Получить сохранённый результат после обрыва соединения |

Для двух `GET` требуется `Authorization: Bearer <sessionId>`. `SlotState.config` содержит разрешённые `bets`, `levels`, `coinValuesCents` и линии `paylines`. `lastBet` равен `null` до первого вращения. `nextAction` равен `SPIN` или `FREE_SPIN`.

## WebSocket

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
