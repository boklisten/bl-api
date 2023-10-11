import { BlError, Order, UserDetail } from "@boklisten/bl-model";
import { BlDocumentStorage } from "../../../../../storage/blDocumentStorage";
import { userDetailSchema } from "../../../../user-detail/user-detail.schema";
import { BlCollectionName } from "../../../../bl-collection";

export class OrderUserDetailValidator {
  private _userDetailStorage: BlDocumentStorage<UserDetail>;

  constructor(userDetailStorage?: BlDocumentStorage<UserDetail>) {
    this._userDetailStorage = userDetailStorage
      ? userDetailStorage
      : new BlDocumentStorage(BlCollectionName.UserDetails, userDetailSchema);
  }

  public validate(order: Order): Promise<boolean> {
    return (
      this._userDetailStorage
        .get(order.customer as string)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .then((userDetail: UserDetail) => {
          /*
        if (!userDetail.emailConfirmed) {
          throw new BlError('userDetail.emailConfirmed is not true');
        }
        */

          return true;
        })
        .catch((userDetailValidateError: BlError) => {
          throw new BlError("userDetail could not be validated").add(
            userDetailValidateError,
          );
        })
    );
  }
}
