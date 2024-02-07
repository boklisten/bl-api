import {
  Order,
  CustomerItem,
  OrderItem,
  UserDetail,
} from "@boklisten/bl-model";

import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { BlCollectionName } from "../../bl-collection";
import { userDetailSchema } from "../../user-detail/user-detail.schema";

export class OrderToCustomerItemGenerator {
  constructor(private _userDetailStorage?: BlDocumentStorage<UserDetail>) {
    this._userDetailStorage = this._userDetailStorage
      ? this._userDetailStorage
      : new BlDocumentStorage(BlCollectionName.UserDetails, userDetailSchema);
  }

  public async generate(order: Order): Promise<CustomerItem[]> {
    const customerItems = [];

    if (!order.customer) {
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const customerDetail = await this._userDetailStorage.get(
      order.customer as string,
    );

    for (const orderItem of order.orderItems) {
      if (this.shouldCreateCustomerItem(orderItem)) {
        const customerItem = this.convertOrderItemToCustomerItem(
          customerDetail,
          order,
          orderItem,
        );
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        customerItem.viewableFor = [customerDetail.blid];
        customerItems.push(customerItem);
      }
    }

    return customerItems;
  }

  private shouldCreateCustomerItem(orderItem: OrderItem) {
    return (
      orderItem.type === "partly-payment" ||
      orderItem.type === "rent" ||
      orderItem.type === "loan" ||
      orderItem.type === "match-receive"
    );
  }

  private convertOrderItemToCustomerItem(
    customerDetail: UserDetail,
    order: Order,
    orderItem: OrderItem,
  ): CustomerItem {
    if (orderItem.type === "partly-payment") {
      return this.createPartlyPaymentCustomerItem(
        customerDetail,
        order,
        orderItem,
      );
    } else if (
      orderItem.type === "rent" ||
      orderItem.type === "match-receive"
    ) {
      return this.createRentCustomerItem(customerDetail, order, orderItem);
    } else if (orderItem.type === "loan") {
      return this.createLoanCustomerItem(customerDetail, order, orderItem);
    }

    throw new Error(`orderItem type "${orderItem.type}" is not supported`);
  }

  private createPartlyPaymentCustomerItem(
    customerDetail: UserDetail,
    order: Order,
    orderItem: OrderItem,
  ): CustomerItem {
    return {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      id: null,
      type: "partly-payment",
      item: orderItem.item,
      blid: orderItem.blid,
      age: orderItem.age,
      customer: order.customer, // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      deadline: orderItem.info.to,
      handout: true,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      handoutInfo: this.createHandoutInfo(order),
      returned: false, // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      amountLeftToPay: orderItem["info"]["amountLeftToPay"],
      totalAmount: orderItem.amount,
      orders: [order.id],
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      customerInfo: this.createCustomerInfo(customerDetail),
    };
  }

  private createRentCustomerItem(
    customerDetail: UserDetail,
    order: Order,
    orderItem: OrderItem,
  ): CustomerItem {
    return {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      id: null,
      type: "rent",
      item: orderItem.item,
      blid: orderItem.blid,
      age: orderItem.age,
      customer: order.customer, // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      deadline: orderItem.info.to,
      handout: true,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      handoutInfo: this.createHandoutInfo(order),
      returned: false,
      totalAmount: orderItem.amount,
      orders: [order.id],
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      customerInfo: this.createCustomerInfo(customerDetail),
    };
  }

  private createLoanCustomerItem(
    customerDetail: UserDetail,
    order: Order,
    orderItem: OrderItem,
  ): CustomerItem {
    return {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      id: null,
      type: "loan",
      item: orderItem.item,
      blid: orderItem.blid,
      age: orderItem.age,
      customer: order.customer, // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      deadline: orderItem.info.to,
      handout: true,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      handoutInfo: this.createHandoutInfo(order),
      returned: false,
      totalAmount: orderItem.amount,
      orders: [order.id],
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      customerInfo: this.createCustomerInfo(customerDetail),
    };
  }

  private createHandoutInfo(order: Order) {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handoutBy: "branch" as any,
      handoutById: order.branch as string,
      handoutEmployee: order.employee as string,
      time: order.creationTime,
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
      guardian: customerDetail.guardian,
    };
  }
}
