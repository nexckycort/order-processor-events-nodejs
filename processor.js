const { EventEmitter } = require("events");

const stockList = require("./stock-list.json");

module.exports = class OrderProcessor extends EventEmitter {
  constructor() {
    super();
  }

  #orderProcessing(topic, orderNumber) {
    this.emit(topic, orderNumber);
  }

  #processingStarted(orderNumber) {
    this.#orderProcessing("PROCESSING_STARTED", orderNumber);
  }

  #processingFailed({ orderNumber, reason, itemId = null }) {
    this.emit("PROCESSING_FAILED", {
      orderNumber,
      reason,
      itemId,
    });
  }

  #processingSuccess(orderNumber) {
    this.#orderProcessing("PROCESSING_SUCCESS", orderNumber);
  }

  placeOrder(order) {
    const { orderNumber } = order;
    this.#processingStarted(orderNumber);

    if (order.lineItems.length === 0)
      this.#processingFailed({
        orderNumber,
        reason: "LINEITEMS_EMPTY",
      });

    let canBeSold = true;
    order.lineItems.forEach((item) => {
      const stockIsAvailable = stockList.find(
        (stock) => stock.id === item.itemId && stock.stock >= item.quantity
      );
      if (stockIsAvailable === undefined) {
        canBeSold = false;
        this.#processingFailed({
          orderNumber,
          reason: "INSUFFICIENT_STOCK",
          itemId: item.itemId,
        });
      }
    });

    if (canBeSold) this.#processingSuccess(orderNumber);
  }
};
