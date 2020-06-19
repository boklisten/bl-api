import {
  Order,
  CustomerItem,
  OrderItem,
  UserDetail
} from "@wizardcoder/bl-model";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { userDetailSchema } from "../../user-detail/user-detail.schema";

export class OrderToCustomerItemGenerator {
  constructor(private _userDetailStorage?: BlDocumentStorage<UserDetail>) {
    this._userDetailStorage = this._userDetailStorage
      ? this._userDetailStorage
      : new BlDocumentStorage("userdetails", userDetailSchema);
  }

  public async generate(order: Order): Promise<CustomerItem[]> {
    let customerItems = [];
    let customerDetail: UserDetail;

    try {
      customerDetail = await this._userDetailStorage.get(
        order.customer as string
      );
    } catch (e) {
      throw e;
    }

    for (let orderItem of order.orderItems) {
      if (this.shouldCreateCustomerItem(orderItem)) {
        customerItems.push(
          this.convertOrderItemToCustomerItem(customerDetail, order, orderItem)
        );
      }
    }

    return customerItems;
  }

  private shouldCreateCustomerItem(orderItem: OrderItem) {
    return (
      orderItem.type === "partly-payment" ||
      orderItem.type === "rent" ||
      orderItem.type === "loan"
    );
  }

  private convertOrderItemToCustomerItem(
    customerDetail: UserDetail,
    order: Order,
    orderItem: OrderItem
  ): CustomerItem {
    if (orderItem.type === "partly-payment") {
      return this.createPartlyPaymentCustomerItem(
        customerDetail,
        order,
        orderItem
      );
    } else if (orderItem.type === "rent") {
      return this.createRentCustomerItem(customerDetail, order, orderItem);
    } else if (orderItem.type === "loan") {
      return this.createLoanCustomerItem(customerDetail, order, orderItem);
    }

    throw new Error(`orderItem type "${orderItem.type}" is not supported`);
  }

  private createPartlyPaymentCustomerItem(
    customerDetail: UserDetail,
    order: Order,
    orderItem: OrderItem
  ): CustomerItem {
    return {
      id: null,
      type: "partly-payment",
      item: orderItem.item,
      age: orderItem.age,
      customer: order.customer,
      deadline: orderItem.info.to,
      handout: true,
      handoutInfo: this.createHandoutInfo(order),
      returned: false,
      amountLeftToPay: orderItem["info"]["amountLeftToPay"],
      totalAmount: orderItem.amount,
      orders: [order.id],
      customerInfo: this.createCustomerInfo(customerDetail)
    };
  }

  private createRentCustomerItem(
    customerDetail: UserDetail,
    order: Order,
    orderItem: OrderItem
  ): CustomerItem {
    return {
      id: null,
      type: "rent",
      item: orderItem.item,
      age: orderItem.age,
      customer: order.customer,
      deadline: orderItem.info.to,
      handout: true,
      handoutInfo: this.createHandoutInfo(order),
      returned: false,
      totalAmount: orderItem.amount,
      orders: [order.id],
      customerInfo: this.createCustomerInfo(customerDetail)
    };
  }

  private createLoanCustomerItem(
    customerDetail: UserDetail,
    order: Order,
    orderItem: OrderItem
  ): CustomerItem {
    return {
      id: null,
      type: "loan",
      item: orderItem.item,
      age: orderItem.age,
      customer: order.customer,
      deadline: orderItem.info.to,
      handout: true,
      handoutInfo: this.createHandoutInfo(order),
      returned: false,
      totalAmount: orderItem.amount,
      orders: [order.id],
      customerInfo: this.createCustomerInfo(customerDetail)
    };
  }

  private createHandoutInfo(order: Order) {
    return {
      handoutBy: "branch" as any,
      handoutById: order.branch as string,
      handoutEmployee: order.employee as string,
      time: order.creationTime
    };
  }

  private createCustomerInfo(customerDetail: UserDetail) {
    return {
      name: customerDetail.name,
      phone: customerDetail.phone,
      address: customerDetail.address,
      postCode: customerDetail.postCode,
      postCity: customerDetail.postCity,
      dob: customerDetail.dob,
      guardian: customerDetail.guardian
    };
  }
}
