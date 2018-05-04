import {AccessToken, BlapiResponse, BlDocument, BlError} from "@wizardcoder/bl-model";
import {NextFunction, Request, Response, Router} from "express";
import {BlDocumentStorage} from "../../storage/blDocumentStorage";
import {ApiPath} from "../../config/api-path";
import {BlEndpoint} from "../../collections/bl-collection";
import {CollectionEndpointAuth} from "../collection-endpoint-auth/collection-endpoint-auth";
import {SEResponseHandler} from "../../response/se.response.handler";
import {SEDbQueryBuilder} from "../../query/se.db-query-builder";


export class CollectionEndpointGetAll<T extends BlDocument> {
	private _collectionUri: string;
	private _collectionEndpointAuth: CollectionEndpointAuth;
	private _responseHandler: SEResponseHandler;

	constructor(private _router: Router, private _endpoint: BlEndpoint, private _documentStorage: BlDocumentStorage<T>, private _collectionName: string) {
		const apiPath = new ApiPath();
		this._collectionUri = apiPath.createPath(this._collectionName);
		this._collectionEndpointAuth = new CollectionEndpointAuth();
		this._responseHandler = new SEResponseHandler();
	}

	public create() {
		this._router.get(this._collectionUri, (req: Request, res: Response, next: NextFunction) => {
			this._collectionEndpointAuth.authenticate(this._endpoint, req, res, next).then((accessToken?: AccessToken) => {
				this.handleGetAll(req, res, accessToken);
			}).catch((authFailure) => {
				this._responseHandler.sendErrorResponse(res, authFailure);
			});
		})
	}

	private handleGetAll(req: Request, res: Response, accessToken?: AccessToken) {
		this._endpoint.hook.before(req.body, accessToken)
			.then(() => this.getAll(req.query))
			.then((docs: T[]) => this._endpoint.hook.after(docs, accessToken))
			.then( (docs: T[]) => this._responseHandler.sendResponse(res, new BlapiResponse(docs)))
			.catch((blError) => this._responseHandler.sendErrorResponse(res, blError));
	}

	private getAll(query?: any): Promise<T[]> {
		if (query && this._endpoint.validQueryParams) { // if the request includes a query
			const dbQueryBuilder = new SEDbQueryBuilder();
			let dbQuery = dbQueryBuilder.getDbQuery(query, this._endpoint.validQueryParams);

			return this._documentStorage.getByQuery(dbQuery).then((docs: T[]) => {
				return docs;
			}).catch((blError: BlError) => {
				throw blError;
			});

		} else { // if no query, give back all objects in collection

			return this._documentStorage.getAll().then((docs: T[]) => {
				return docs;
			}).catch((blError: BlError) => {
				throw blError;
			});
		}
	}
}