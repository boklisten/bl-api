import { BlDocument } from "@boklisten/bl-model";
import { CollectionEndpointMethod } from "../collection-endpoint-method";
import { CollectionEndpointOnRequest } from "../collection-endpoint-on-request";
import { BlApiRequest } from "../../request/bl-api-request";

export class CollectionEndpointDelete<T extends BlDocument>
  extends CollectionEndpointMethod<T>
  implements CollectionEndpointOnRequest<T>
{
  override onRequest(blApiRequest: BlApiRequest): Promise<T[]> {
    return this._documentStorage
      .remove(blApiRequest.documentId, {
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
