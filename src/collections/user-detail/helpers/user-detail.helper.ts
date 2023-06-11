import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { AccessToken, BlError, UserDetail } from "@boklisten/bl-model";
import { userDetailSchema } from "../user-detail.schema";
import { DibsEasyPayment } from "../../../payment/dibs/dibs-easy-payment/dibs-easy-payment";
import { isNullOrUndefined } from "util";
import { BlCollectionName } from "../../bl-collection";

export class UserDetailHelper {
  private _userDetailStorage: BlDocumentStorage<UserDetail>;

  constructor(userDetailStorage?: BlDocumentStorage<UserDetail>) {
    this._userDetailStorage = userDetailStorage
      ? userDetailStorage
      : new BlDocumentStorage(BlCollectionName.UserDetails, userDetailSchema);
  }

  public updateUserDetailBasedOnDibsEasyPayment(
    userDetailId: string,
    dibsEasyPayment: DibsEasyPayment,
    accessToken: AccessToken
  ): Promise<UserDetail> {
    return new Promise((resolve, reject) => {
      this._userDetailStorage
        .get(userDetailId)
        .then((userDetail: UserDetail) => {
          const updateObject = this.getUserDetailUpdateObject(
            dibsEasyPayment,
            userDetail
          );

          this._userDetailStorage
            .update(userDetailId, updateObject, {
              id: accessToken.sub,
              permission: accessToken.permission,
            })
            .then((updatedUserDetail: UserDetail) => {
              resolve(updatedUserDetail);
            })
            .catch((updateUserDetailError: BlError) => {
              reject(
                new BlError(
                  `could not update userDetail "${userDetailId}" with user details from dibsPayment`
                ).add(updateUserDetailError)
              );
            });
        })
        .catch((getUserDetailError: BlError) => {
          reject(
            new BlError(`could not get userDetail "${userDetailId}"`).add(
              getUserDetailError
            )
          );
        });
    });
  }

  private getUserDetailUpdateObject(
    dibsEasyPayment: DibsEasyPayment,
    userDetail: UserDetail
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any {
    const dibsUserDetail = dibsEasyPayment.consumer.privatePerson;
    const dibsShippingAddress = dibsEasyPayment.consumer.shippingAddress;

    const userDetailUpdateObject = {};

    if (isNullOrUndefined(userDetail.name) || userDetail.name.length <= 0) {
      if (dibsUserDetail.firstName && dibsUserDetail.lastName) {
        userDetailUpdateObject["name"] =
          dibsUserDetail.firstName + " " + dibsUserDetail.lastName;
      }
    }

    if (isNullOrUndefined(userDetail.phone) || userDetail.phone.length <= 0) {
      if (dibsUserDetail.phoneNumber && dibsUserDetail.phoneNumber.number) {
        userDetailUpdateObject["phone"] = dibsUserDetail.phoneNumber.number;
      }
    }

    if (
      isNullOrUndefined(userDetail.address) ||
      userDetail.address.length <= 0
    ) {
      if (dibsShippingAddress.addressLine1) {
        userDetailUpdateObject["address"] =
          dibsShippingAddress.addressLine1 +
          " " +
          dibsShippingAddress.addressLine2;
      }
    }

    if (
      isNullOrUndefined(userDetail.postCity) ||
      userDetail.postCity.length <= 0
    ) {
      if (dibsShippingAddress.city) {
        userDetailUpdateObject["postCity"] = dibsShippingAddress.city;
      }
    }

    if (
      isNullOrUndefined(userDetail.postCode) ||
      userDetail.postCode.length <= 0
    ) {
      if (dibsShippingAddress.postalCode) {
        userDetailUpdateObject["postCode"] = dibsShippingAddress.postalCode;
      }
    }

    return userDetailUpdateObject;
  }

  public isValid(userDetail: UserDetail): boolean {
    const invalidUserDetailFields = this.getInvalidUserDetailFields(userDetail);

    return invalidUserDetailFields.length <= 0 && userDetail.active;
  }

  public getFirstName(name: string) {
    const splitName = name.trimRight().split(" ");
    if (splitName.length <= 1) {
      return name.trim();
    } else {
      return splitName.slice(0, -1).join(" ").trim();
    }
  }

  public getLastName(name: string) {
    const splitName = name.trimRight().split(" ");
    if (splitName.length <= 1) {
      return "";
    } else {
      return splitName.slice(-1).join(" ");
    }
  }

  public getInvalidUserDetailFields(userDetail: UserDetail) {
    const invalidFields = [];

    if (isNullOrUndefined(userDetail.name) || userDetail.name.length <= 0) {
      invalidFields.push("name");
    }

    if (
      isNullOrUndefined(userDetail.address) ||
      userDetail.address.length <= 0
    ) {
      invalidFields.push("address");
    }

    if (
      isNullOrUndefined(userDetail.postCode) ||
      userDetail.postCode.length <= 0
    ) {
      invalidFields.push("postCode");
    }

    if (
      isNullOrUndefined(userDetail.postCity) ||
      userDetail.postCity.length <= 0
    ) {
      invalidFields.push("postCity");
    }

    if (isNullOrUndefined(userDetail.phone) || userDetail.phone.length <= 0) {
      invalidFields.push("phone");
    }
    /*
    if (
      isNullOrUndefined(userDetail.emailConfirmed) ||
      !userDetail.emailConfirmed
    ) {
      invalidFields.push('emailConfirmed');
    }
    */

    if (isNullOrUndefined(userDetail.dob)) {
      invalidFields.push("dob");
    }

    return invalidFields;
  }
}
