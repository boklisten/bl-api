/* eslint-disable @typescript-eslint/no-explicit-any */
import { Hook } from "../../../hook/hook";
import {
  AccessToken,
  BlError,
  CustomerItem,
  Order,
  UserDetail,
} from "@boklisten/bl-model";
import { CustomerItemValidator } from "../validators/customer-item-validator";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { userDetailSchema } from "../../user-detail/user-detail.schema";
import { orderSchema } from "../../order/order.schema";
import { UserDetailHelper } from "../../user-detail/helpers/user-detail.helper";
import { BlCollectionName } from "../../bl-collection";

export class CustomerItemPostHook extends Hook {
  private _customerItemValidator: CustomerItemValidator;
  private _userDetailStorage: BlDocumentStorage<UserDetail>;
  private _orderStorage: BlDocumentStorage<Order>;
  private _userDetailHelper: UserDetailHelper;

  constructor(
    customerItemValidator?: CustomerItemValidator,
    customerItemStorage?: BlDocumentStorage<CustomerItem>,
    userDetailStorage?: BlDocumentStorage<UserDetail>,
    orderStorage?: BlDocumentStorage<Order>,
    userDetailHelper?: UserDetailHelper
  ) {
    super();
    this._customerItemValidator =
      customerItemValidator ?? new CustomerItemValidator();
    this._userDetailStorage =
      userDetailStorage ??
      new BlDocumentStorage(BlCollectionName.UserDetails, userDetailSchema);
    this._orderStorage =
      orderStorage ??
      new BlDocumentStorage(BlCollectionName.Orders, orderSchema);
    this._userDetailHelper = userDetailHelper ?? new UserDetailHelper();
  }

  public override before(
    customerItem: CustomerItem,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    accessToken: AccessToken,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id?: string
  ): Promise<boolean> {
    if (!customerItem) {
      return Promise.reject(new BlError("customerItem is undefined"));
    }

    return this._userDetailStorage
      .get(customerItem.customer as any)
      .then((userDetail: UserDetail) => {
        if (!this._userDetailHelper.isValid(userDetail)) {
          throw new BlError(`userDetail "${customerItem.customer}" not valid`);
        }

        return this._customerItemValidator
          .validate(customerItem)
          .then(() => {
            return true;
          })
          .catch((customerItemValidationError: BlError) => {
            throw new BlError("could not validate customerItem").add(
              customerItemValidationError
            );
          });
      })
      .catch((blError: BlError) => {
        throw blError;
      });
  }

  public override after(
    customerItems: CustomerItem[],
    accessToken: AccessToken
  ): Promise<CustomerItem[]> {
    // we know that the customerItem that is sent here are valid, we can just update the userDetail

    if (!customerItems || customerItems.length <= 0) {
      return Promise.reject(new BlError("customerItems is empty or undefined"));
    }

    if (customerItems.length > 1) {
      return Promise.reject(
        new BlError("there are more than one customerItem")
      );
    }

    const customerItem: CustomerItem = customerItems[0];

    if (!customerItem.orders) {
      return Promise.reject(new BlError("customerItem.orders is not defined"));
    }

    if (customerItem.orders.length !== 1) {
      return Promise.reject(
        new BlError(
          `customerItem.orders.length is "${customerItem.orders.length}" but should be "1"`
        )
      );
    }

    return this._orderStorage
      .get(customerItem.orders[0] as any)
      .then((order: Order) => {
        //update the corresponding orderItem with customerItem
        for (const orderItem of order.orderItems) {
          if (orderItem.item.toString() === customerItem.item.toString()) {
            orderItem.info = Object.assign(
              { customerItem: customerItem.id },
              orderItem.info
            );
            break;
          }
        }
        return this._orderStorage.update(
          order.id,
          { orderItems: order.orderItems },
          { id: accessToken.sub, permission: accessToken.permission }
        );
      })
      .then(() => {
        return this._userDetailStorage.get(customerItem.customer as any);
      })
      .then((userDetail: UserDetail) => {
        let newCustomerItems = [];

        if (
          !userDetail.customerItems ||
          (userDetail.customerItems && userDetail.customerItems.length === 0)
        ) {
          newCustomerItems.push(customerItem.id);
        } else if (
          userDetail.customerItems &&
          userDetail.customerItems.length > 0
        ) {
          newCustomerItems = userDetail.customerItems;
          newCustomerItems.push(customerItem.id);
        }

        return this._userDetailStorage.update(
          userDetail.id,
          { customerItems: newCustomerItems },
          { id: accessToken.sub, permission: accessToken.permission }
        );
      })
      .then(() => {
        return [customerItem];
      })
      .catch((blError: BlError) => {
        throw blError
          .store("userDetail", accessToken.sub)
          .store("customerItemId", customerItem.id);
      });
  }
}
