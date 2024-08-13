import { BlapiResponse, BlError, Order, UserDetail } from "@boklisten/bl-model";
import { ObjectId } from "mongodb";

import { SystemUser } from "../../../auth/permission/permission.service";
import { Operation } from "../../../operation/operation";
import { BlApiRequest } from "../../../request/bl-api-request";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { BlCollectionName } from "../../bl-collection";
import { orderSchema } from "../../order/order.schema";
import { userDetailSchema } from "../../user-detail/user-detail.schema";
import {
  deserializeBase64EncodedImage,
  guardianSignatureRequired,
  serializeSignature,
  signOrders,
} from "../helpers/signature.helper";
import { Signature, signatureSchema } from "../signature.schema";

export declare class SerializedGuardianSignature {
  customerId: string;
  base64EncodedImage: string;
  signingName: string;
}

export class GuardianSignatureOperation implements Operation {
  private readonly _userDetailStorage: BlDocumentStorage<UserDetail>;
  private readonly _orderStorage: BlDocumentStorage<Order>;
  private readonly _signatureStorage: BlDocumentStorage<Signature>;

  constructor(
    signatureStorage?: BlDocumentStorage<Signature>,
    orderStorage?: BlDocumentStorage<Order>,
    userDetailStorage?: BlDocumentStorage<UserDetail>,
  ) {
    this._signatureStorage =
      signatureStorage ??
      new BlDocumentStorage(BlCollectionName.Signatures, signatureSchema);
    this._orderStorage =
      orderStorage ??
      new BlDocumentStorage(BlCollectionName.Orders, orderSchema);
    this._userDetailStorage =
      userDetailStorage ??
      new BlDocumentStorage(BlCollectionName.UserDetails, userDetailSchema);
  }

  async run(blApiRequest: BlApiRequest): Promise<BlapiResponse> {
    const serializedGuardianSignature = blApiRequest.data;
    if (!validateSerializedGuardianSignature(serializedGuardianSignature))
      throw new BlError("Bad serialized guardian signature").code(701);

    const userDetail = await this._userDetailStorage.get(
      serializedGuardianSignature.customerId,
    );

    if (
      !(await guardianSignatureRequired(userDetail, this._signatureStorage))
    ) {
      throw new BlError(
        "Valid guardian signature is already present or not needed.",
      ).code(813);
    }

    const signatureImage = await deserializeBase64EncodedImage(
      serializedGuardianSignature.base64EncodedImage,
    );

    const writtenSignature = await this._signatureStorage.add(
      {
        // @ts-expect-error id will be auto-generated
        id: null,
        image: signatureImage,
        signedByGuardian: true,
        signingName: serializedGuardianSignature.signingName,
      },
      new SystemUser(),
    );

    await this._userDetailStorage.update(
      userDetail.id,
      { signatures: [...userDetail.signatures, writtenSignature.id] },
      new SystemUser(),
    );

    await signOrders(this._orderStorage, userDetail);

    return new BlapiResponse([serializeSignature(writtenSignature)]);
  }
}

function validateSerializedGuardianSignature(
  serializedGuardianSignature: unknown,
): serializedGuardianSignature is SerializedGuardianSignature {
  const s = serializedGuardianSignature as Partial<SerializedGuardianSignature>;
  return (
    s != null &&
    typeof s.customerId === "string" &&
    ObjectId.isValid(s.customerId) &&
    typeof s.base64EncodedImage === "string" &&
    typeof s.signingName === "string"
  );
}
