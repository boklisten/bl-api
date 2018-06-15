import {AccessToken, BlDocument, BlError} from "@wizardcoder/bl-model";
import {Request, Router} from "express";
import {BlDocumentStorage} from "../../storage/blDocumentStorage";
import {BlEndpoint} from "../../collections/bl-collection";
import {SEDbQueryBuilder} from "../../query/se.db-query-builder";
import {CollectionEndpointMethod} from "../collection-endpoint-method";
import {CollectionEndpointOnRequest} from "../collection-endpoint-on-request";
import {SEDbQuery} from "../../query/se.db-query";


export class CollectionEndpointGetAll<T extends BlDocument> extends CollectionEndpointMethod<T> implements CollectionEndpointOnRequest<T> {

	public onRequest(req: Request, accessToken?: AccessToken): Promise<T[]> {
		if (req.query && Object.getOwnPropertyNames(req.query).length > 0 && this._endpoint.validQueryParams) { // if the request includes a query

			const dbQueryBuilder = new SEDbQueryBuilder();
			let dbQuery: SEDbQuery;

			try {
				dbQuery = dbQueryBuilder.getDbQuery(req.query, this._endpoint.validQueryParams);
			} catch (e) {
				throw new BlError('could not create query from request query string').add(e).store('query', req.query);
			}

			return this._documentStorage.getByQuery(dbQuery).then((docs: T[]) => {
				return docs;
			}).catch((blError: BlError) => {
				throw blError;
			});

		} else { // if no query, give back all objects in collection
			let permission = null;
			if (accessToken) {
				permission = accessToken.permission;
			}

			return this._documentStorage.getAll(permission).then((docs: T[]) => {
				return docs;
			}).catch((blError: BlError) => {
				throw blError;
			});
		}
	}
}