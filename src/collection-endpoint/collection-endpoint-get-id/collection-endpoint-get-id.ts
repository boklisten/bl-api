import {AccessToken, BlDocument, BlError} from "@wizardcoder/bl-model";
import {NextFunction, Request, Response, Router} from "express";
import {BlEndpoint} from "../../collections/bl-collection";
import {BlDocumentStorage} from "../../storage/blDocumentStorage";
import {ApiPath} from "../../config/api-path";
import {CollectionEndpointMethod} from "../collection-endpoint-method";
import {CollectionEndpointOnRequest} from "../collection-endpoint-on-request";
import {BlApiRequest} from "../../request/bl-api-request";

export class CollectionEndpointGetId<T extends BlDocument> extends CollectionEndpointMethod<T> implements CollectionEndpointOnRequest<T> {

	public onRequest(blApiRequest: BlApiRequest): Promise<T[]> {
		return new Promise((resolve, reject) => {
			this._documentStorage.get(blApiRequest.documentId).then((doc: T) => {
				resolve([doc])
			}).catch((blError: BlError) => {
				reject(blError);
			});
		});
	}
}