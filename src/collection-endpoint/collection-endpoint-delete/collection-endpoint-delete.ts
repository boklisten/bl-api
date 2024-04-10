import { BlDocument } from "@boklisten/bl-model";

import { BlApiRequest } from "../../request/bl-api-request";
import { CollectionEndpointMethod } from "../collection-endpoint-method";
import { CollectionEndpointOnRequest } from "../collection-endpoint-on-request";

export class CollectionEndpointDelete<T extends BlDocument>
  extends CollectionEndpointMethod<T>
  implements CollectionEndpointOnRequest<T>
{
  override onRequest(blApiRequest: BlApiRequest): Promise<T[]> {
    return (
      this._documentStorage
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        .remove(blApiRequest.documentId, {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          id: blApiRequest.user.id,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          permission: blApiRequest.user.permission,
        })
        .then((doc: T) => {
          return [doc];
        })
        .catch((blError) => {
          throw blError;
        })
    );
  }
}
