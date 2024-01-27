import { BlDocument } from "@boklisten/bl-model";

import { BlApiRequest } from "../../request/bl-api-request";
import { CollectionEndpointMethod } from "../collection-endpoint-method";
import { CollectionEndpointOnRequest } from "../collection-endpoint-on-request";

export class CollectionEndpointPut<T extends BlDocument>
  extends CollectionEndpointMethod<T>
  implements CollectionEndpointOnRequest<T>
{
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  override async onRequest(blApiRequest: BlApiRequest): Promise<T[]> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await this._documentStorage.put(blApiRequest.documentId, blApiRequest.data);
    return [];
  }
}
