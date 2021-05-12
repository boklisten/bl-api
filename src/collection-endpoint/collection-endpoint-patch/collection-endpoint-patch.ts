import { AccessToken, BlDocument } from "@boklisten/bl-model";
import { CollectionEndpointMethod } from "../collection-endpoint-method";
import { CollectionEndpointOnRequest } from "../collection-endpoint-on-request";
import { Request } from "express";
import { BlApiRequest } from "../../request/bl-api-request";

export class CollectionEndpointPatch<T extends BlDocument>
  extends CollectionEndpointMethod<T>
  implements CollectionEndpointOnRequest<T>
{
  onRequest(blApiRequest: BlApiRequest): Promise<T[]> {
    return this._documentStorage
      .update(blApiRequest.documentId, blApiRequest.data, {
        id: blApiRequest.user.id,
        permission: blApiRequest.user.permission,
      })
      .then((doc: T) => {
        return [doc];
      })
      .catch((blError) => {
        throw blError;
      });
  }
}
