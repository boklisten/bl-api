import { BlDocument, BlError } from "@boklisten/bl-model";

import { BlApiRequest } from "../../request/bl-api-request";
import { CollectionEndpointMethod } from "../collection-endpoint-method";
import { CollectionEndpointOnRequest } from "../collection-endpoint-on-request";

export class CollectionEndpointGetId<T extends BlDocument>
  extends CollectionEndpointMethod<T>
  implements CollectionEndpointOnRequest<T>
{
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  public override onRequest(blApiRequest: BlApiRequest): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this._documentStorage // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
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
