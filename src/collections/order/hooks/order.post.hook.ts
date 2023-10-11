import { BlError, Order, UserDetail, AccessToken } from "@boklisten/bl-model";

import { OrderHookBefore } from "./order-hook-before";
import { Hook } from "../../../hook/hook";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { BlCollectionName } from "../../bl-collection";
import { UserDetailHelper } from "../../user-detail/helpers/user-detail.helper";
import { userDetailSchema } from "../../user-detail/user-detail.schema";
import { OrderValidator } from "../helpers/order-validator/order-validator";

export class OrderPostHook extends Hook {
  private orderValidator: OrderValidator;
  private orderHookBefore: OrderHookBefore;
  private userDetailStorage: BlDocumentStorage<UserDetail>;
  private userDetailHelper: UserDetailHelper;

  constructor(
    orderValidator?: OrderValidator,
    orderHookBefore?: OrderHookBefore,
    userDetailStorage?: BlDocumentStorage<UserDetail>,
    userDetailHelper?: UserDetailHelper,
  ) {
    super();
    this.orderValidator = orderValidator ?? new OrderValidator();
    this.orderHookBefore = orderHookBefore ?? new OrderHookBefore();
    this.userDetailStorage =
      userDetailStorage ??
      new BlDocumentStorage(BlCollectionName.UserDetails, userDetailSchema);
    this.userDetailHelper = userDetailHelper ?? new UserDetailHelper();
  }

  public override async before(
    requestBody: unknown,
    accessToken: AccessToken,
  ): Promise<boolean> {
    const [validUserDetails, validRequestBody] = await Promise.all([
      this.userDetailStorage
        .get(accessToken.details)
        .then((userDetail) => this.userDetailHelper.isValid(userDetail)),
      this.orderHookBefore.validate(requestBody),
    ]);
    if (!validUserDetails) {
      throw new BlError(
        "UserDetail not set for user: " + accessToken.username,
      ).code(902);
    }
    if (!validRequestBody) {
      throw new BlError("Invalid order").code(701);
    }

    return true;
  }

  public override after(
    orders: Order[],
    accessToken?: AccessToken,
  ): Promise<Order[]> {
    if (!accessToken || accessToken.sub.length <= 0) {
      return Promise.reject(
        new BlError(
          "accessToken was not specified when trying to process order",
        ),
      );
    }

    if (!orders || orders.length <= 0) {
      return Promise.reject(new BlError("no orders provided").code(701));
    }

    if (orders.length > 1) {
      return Promise.reject(new BlError("orderIds included more than one id"));
    }

    const order = orders[0];

    return this.validateOrder(order).then(() => {
      return [order];
    });
  }

  private validateOrder(order: Order): Promise<Order> {
    return new Promise((resolve, reject) => {
      this.orderValidator
        .validate(order)
        .then(() => {
          if (order.placed) {
            return reject(
              new BlError("order.placed is set to true on post of order"),
            );
          }

          resolve(order);
        })
        .catch((blError: BlError) => {
          return reject(blError);
        });
    });
  }
}
