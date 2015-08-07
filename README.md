# dinvio-widget
Dinvio E-commerce Basket Widget

## Требования
Для установки виджета не требуется никаких дополнительных библиотек.

Поддержка браузерами: IE9+


## Подключение виджета
```js
var widget = new DinvioWidget(widgetPlace, {
    publicKey: ...
});
```
где
`widgetPlace` — id элемента, или сам DOM-элемент, куда будет встроен виджет,
`publicKey` — публичный ключ API


## Методы
```js
widget.setParcelData(packages, totalCost)
```
Сообщает виджету данные об отправлении.
`packages` — массив коробок:
```js
[
    {
        weight: ...,    // Вес коробки в килограммах
        length: ...,    // Длина в сантиметрах
        width: ...,     // Ширина в сантиметрах
        height: ...,    // Высота в сантиметрах
    },
    ...
]
```
`totalCost` — объявленная стоимость отправления в рублях
