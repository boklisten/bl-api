import {
  AccessToken,
  BlError,
  Order,
  SerializedSignature,
  UserDetail,
} from "@boklisten/bl-model";

import { SystemUser } from "../../../auth/permission/permission.service";
import { Hook } from "../../../hook/hook";
import { logger } from "../../../logger/logger";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { BlCollectionName } from "../../bl-collection";
import { orderSchema } from "../../order/order.schema";
import { userDetailSchema } from "../../user-detail/user-detail.schema";
import {
  deserializeSignature,
  isUnderage,
  serializeSignature,
} from "../helpers/signature.helper";
import { Signature } from "../signature.schema";

export class SignaturePostHook extends Hook {
  private userDetailStorage: BlDocumentStorage<UserDetail>;
  private orderStorage: BlDocumentStorage<Order>;

  constructor(
    userDetailStorage?: BlDocumentStorage<UserDetail>,
    orderStorage?: BlDocumentStorage<Order>,
  ) {
    super();
    this.userDetailStorage =
      userDetailStorage ??
      new BlDocumentStorage<UserDetail>(
        BlCollectionName.UserDetails,
        userDetailSchema,
      );
    this.orderStorage =
      orderStorage ??
      new BlDocumentStorage<Order>(BlCollectionName.Orders, orderSchema);
  }

  override async before(
    body: unknown,
    accessToken: AccessToken,
  ): Promise<Signature> {
    const serializedSignature = body;
    if (!validateSerialiedSignature(serializedSignature))
      throw new BlError("Bad serialized signature").code(701);

    const userDetail = await this.userDetailStorage.get(accessToken.details);
    if (serializedSignature.signedByGuardian != isUnderage(userDetail)) {
      throw new BlError("Signature signer does not match expected signer").code(
        812,
      );
    }

    return await deserializeSignature(serializedSignature);
  }

  override async after(
    docs: Signature[],
    accessToken: AccessToken,
  ): Promise<[SerializedSignature]> {
    const [writtenSignature] = docs;
    if (!writtenSignature) {
      throw new BlError(
        "This should be unreachable because the signature should be written",
      ).code(200);
    }
    const userDetail = await this.userDetailStorage.get(accessToken.details);
    await this.userDetailStorage.update(
      userDetail.id,
      { signatures: [writtenSignature.id, ...userDetail.signatures] },
      { id: accessToken.details, permission: accessToken.permission },
    );

    await this.signOrders(userDetail);

    return [serializeSignature(writtenSignature)];
  }

  private async signOrders(userDetail: UserDetail) {
    if (!(userDetail.orders && userDetail.orders.length > 0)) {
      return;
    }
    const orders = await this.orderStorage.getMany(
      userDetail.orders as string[],
    );
    await Promise.all(
      orders
        .filter((order) => order.pendingSignature)
        .map(async (order) => {
          return await this.orderStorage
            .update(order.id, { pendingSignature: false }, new SystemUser())
            .catch((e) =>
              logger.error(
                `While processing new signature, unable to update order ${order.id}: ${e}`,
              ),
            );
        }),
    );
  }
}

function validateSerialiedSignature(
  serializedSignature: unknown,
): serializedSignature is SerializedSignature {
  const s = serializedSignature as Partial<SerializedSignature>;
  return (
    s != null &&
    typeof s.base64EncodedImage === "string" &&
    typeof s.signedByGuardian === "boolean" &&
    typeof s.signingName === "string"
  );
}
