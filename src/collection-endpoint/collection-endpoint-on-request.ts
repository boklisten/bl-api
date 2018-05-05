import {CollectionEndpointMethod} from "./collection-endpoint-method";
import {AccessToken, BlDocument} from "@wizardcoder/bl-model";
import {Request} from "express";
import {BlApiRequest} from "../request/bl-api-request";

export interface CollectionEndpointOnRequest<T extends BlDocument> extends CollectionEndpointMethod<T> {
	onRequest(blApiRequest: BlApiRequest): Promise<T[]>;
}