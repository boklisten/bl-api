import { Order, OrderItem, BlError, Branch, Item } from "@boklisten/bl-model";
import { isNullOrUndefined, isNumber } from "util";
import { OrderItemExtendValidator } from "./order-item-extend-validator/order-item-extend-validator";
import { BlDocumentStorage } from "../../../../../storage/blDocumentStorage";
import { branchSchema } from "../../../../branch/branch.schema";
import { itemSchema } from "../../../../item/item.schema";
import { OrderItemBuyValidator } from "./order-item-buy-validator/order-item-buy-validator";
import { OrderItemRentValidator } from "./order-item-rent-validator/order-item-rent-validator";
import { OrderFieldValidator } from "../order-field-validator/order-field-validator";
import { PriceService } from "../../../../../price/price.service";
import { OrderItemPartlyPaymentValidator } from "./order-item-partly-payment-validator/order-item-partly-payment-validator";

export class OrderItemValidator {
  private orderItemFieldValidator: OrderFieldValidator;
  private orderItemExtendValidator: OrderItemExtendValidator;
  private orderItemBuyValidator: OrderItemBuyValidator;
  private orderItemRentValidator: OrderItemRentValidator;
  private orderItemPartlyPaymentValidator: OrderItemPartlyPaymentValidator;
  private branchStorage: BlDocumentStorage<Branch>;
  private itemStorage: BlDocumentStorage<Item>;
  private priceService: PriceService;

  constructor(
    branchStorage?: BlDocumentStorage<Branch>,
    itemStorage?: BlDocumentStorage<Item>,
    orderItemFieldValidator?: OrderFieldValidator,
    orderItemRentValidator?: OrderItemRentValidator,
    orderItemBuyValidator?: OrderItemBuyValidator,
    orderItemExtendValidator?: OrderItemExtendValidator,
    orderItemPartlyPaymentValidator?: OrderItemPartlyPaymentValidator
  ) {
    this.branchStorage = branchStorage
      ? branchStorage
      : new BlDocumentStorage("branches", branchSchema);
    this.itemStorage = itemStorage
      ? itemStorage
      : new BlDocumentStorage("items", itemSchema);

    this.orderItemFieldValidator = orderItemFieldValidator
      ? orderItemFieldValidator
      : new OrderFieldValidator();
    this.orderItemRentValidator = orderItemRentValidator
      ? orderItemRentValidator
      : new OrderItemRentValidator();
    this.orderItemBuyValidator = orderItemBuyValidator
      ? orderItemBuyValidator
      : new OrderItemBuyValidator();
    this.orderItemExtendValidator = orderItemExtendValidator
      ? orderItemExtendValidator
      : new OrderItemExtendValidator();
    this.priceService = new PriceService({ roundDown: true });
    this.orderItemPartlyPaymentValidator = orderItemPartlyPaymentValidator
      ? orderItemPartlyPaymentValidator
      : new OrderItemPartlyPaymentValidator();
  }

  public async validate(branch: Branch, order: Order): Promise<boolean> {
    try {
      await this.orderItemFieldValidator.validate(order);
      this.validateAmount(order);

      for (let orderItem of order.orderItems) {
        let item = await this.itemStorage.get(orderItem.item as string);
        await this.validateOrderItemBasedOnType(branch, item, orderItem);
        this.validateOrderItemAmounts(orderItem);
      }
    } catch (e) {
      if (e instanceof BlError) {
        return Promise.reject(e);
      }
      return Promise.reject(
        new BlError("unknown error, orderItem could not be validated").store(
          "error",
          e
        )
      );
    }
  }

  private async validateOrderItemBasedOnType(
    branch: Branch,
    item: Item,
    orderItem: OrderItem
  ): Promise<boolean> {
    switch (orderItem.type) {
      case "rent":
        return await this.orderItemRentValidator.validate(
          branch,
          orderItem,
          item
        );
      case "partly-payment":
        return await this.orderItemPartlyPaymentValidator.validate(
          orderItem,
          item,
          branch
        );
      case "buy":
        return await this.orderItemBuyValidator.validate(
          branch,
          orderItem,
          item
        );
      case "extend":
        return await this.orderItemExtendValidator.validate(branch, orderItem);
    }
  }

  private validateOrderItemAmounts(orderItem: OrderItem) {
    let expectedTotalAmount = this.priceService.sanitize(
      orderItem.unitPrice + orderItem.taxAmount
    );

    if (orderItem.amount !== expectedTotalAmount) {
      throw new BlError(
        `orderItem.amount "${orderItem.amount}" is not equal to orderItem.unitPrice "${orderItem.unitPrice}" + orderItem.taxAmount "${orderItem.taxAmount}"`
      );
    }

    let expectedTaxAmount = this.priceService.sanitize(
      orderItem.unitPrice * orderItem.taxRate
    );

    if (orderItem.taxAmount !== expectedTaxAmount) {
      throw new BlError(
        `orderItem.taxAmount "${orderItem.taxAmount}" is not equal to orderItem.unitPrice "${orderItem.unitPrice}" * orderItem.taxRate "${orderItem.taxRate}"`
      );
    }
  }

  private validateAmount(order: Order): boolean {
    let expectedTotalAmount = 0;

    for (let orderItem of order.orderItems) {
      expectedTotalAmount += orderItem.amount;
    }

    if (expectedTotalAmount !== order.amount) {
      throw new BlError(
        `order.amount is "${order.amount}" but total of orderItems amount is "${expectedTotalAmount}"`
      );
    }

    return true;
  }
}
