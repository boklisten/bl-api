import { BlDocument, BlError } from "@boklisten/bl-model";
import { CollectionEndpointMethod } from "../collection-endpoint-method";
import { CollectionEndpointOnRequest } from "../collection-endpoint-on-request";
import { BlApiRequest } from "../../request/bl-api-request";

export class CollectionEndpointGetId<T extends BlDocument>
  extends CollectionEndpointMethod<T>
  implements CollectionEndpointOnRequest<T>
{
  public override onRequest(blApiRequest: BlApiRequest): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this._documentStorage
        .get(blApiRequest.documentId, blApiRequest.user.permission)
        .then((doc: T) => {
          resolve([doc]);
        })
        .catch((blError: BlError) => {
          reject(blError);
        });
    });
  }
}
