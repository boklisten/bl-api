import { CollectionEndpointMethod } from "./collection-endpoint-method";
import { BlDocument } from "@boklisten/bl-model";
import { BlApiRequest } from "../request/bl-api-request";

export interface CollectionEndpointOnRequest<T extends BlDocument>
  extends CollectionEndpointMethod<T> {
  onRequest(blApiRequest: BlApiRequest): Promise<T[]>;
}
