import {AccessToken, BlDocument, BlError} from "@wizardcoder/bl-model";
import {CollectionEndpointMethod} from "../collection-endpoint-method";
import {CollectionEndpointOnRequest} from "../collection-endpoint-on-request";
import {Request} from "express";
import {BlApiRequest} from "../../request/bl-api-request";

export class CollectionEndpointPost<T extends BlDocument> extends CollectionEndpointMethod<T> implements CollectionEndpointOnRequest<T> {

	onRequest(blApiRequest: BlApiRequest): Promise<T[]> {
		return this._documentStorage.add(blApiRequest.data, {id: blApiRequest.user.id, permission: blApiRequest.user.permission}).then((doc: T) => {
			return [doc];
		}).catch((blError) => {
			throw new BlError('could not add document').add(blError);
		});
	}
}