import { BlDocument } from "@boklisten/bl-model";

import { CollectionEndpointMethod } from "./collection-endpoint-method";
import { BlApiRequest } from "../request/bl-api-request";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export interface CollectionEndpointOnRequest<T extends BlDocument>
  extends CollectionEndpointMethod<T> {
  onRequest(blApiRequest: BlApiRequest): Promise<T[]>;
}
