import {CollectionEndpointAuth} from "./collection-endpoint-auth/collection-endpoint-auth";
import {SEResponseHandler} from "../response/se.response.handler";
import {NextFunction, Request, Response, Router} from "express";
import {BlEndpoint} from "../collections/bl-collection";
import {ApiPath} from "../config/api-path";
import {AccessToken, BlapiResponse, BlDocument, BlError} from "@wizardcoder/bl-model";
import {Hook} from "../hook/hook";
import {BlDocumentStorage} from "../storage/blDocumentStorage";
import {BlApiRequest} from "../request/bl-api-request";
import {CollectionEndpointDocumentAuth} from "./collection-endpoint-document/collection-endpoint-document-auth";
declare var onRequest: any;

export class CollectionEndpointMethod<T extends BlDocument> {
	protected _collectionUri: string;
	protected _collectionEndpointAuth: CollectionEndpointAuth;
	protected _responseHandler: SEResponseHandler;
	protected _collectionEndpointDocumentAuth: CollectionEndpointDocumentAuth<T>;


	constructor(protected _router: Router, protected _endpoint: BlEndpoint, protected _collectionName: string, protected _documentStorage: BlDocumentStorage<T>) {
		const apiPath = new ApiPath();
		this._collectionUri = apiPath.createPath(this._collectionName);
		this._collectionEndpointAuth = new CollectionEndpointAuth();
		this._responseHandler = new SEResponseHandler();
		this._collectionEndpointDocumentAuth = new CollectionEndpointDocumentAuth<T>();

		if (!_endpoint.hook) {
			this._endpoint.hook = new Hook();
		}
	}

	public create() {
		switch (this._endpoint.method) {
			case 'getAll':
				this.routerGetAll();
				break;
			case 'getId':
				this.routerGetId();
				break;
			case 'post':
				this.routerPost();
				break;
			case 'patch':
				this.routerPatch();
				break;
			case 'delete':
				this.routerDelete();
				break;
			case 'put':
				this.routerPut();
				break;
			default:
				throw new BlError(`the endpoint "${this._endpoint.method}" is not supported`);
		}
	}

	private handleRequest(req: Request, res: Response, next: NextFunction) {
		let userAccessToken: AccessToken;
		let blApiRequest: BlApiRequest;

		this._collectionEndpointAuth.authenticate(this._endpoint, req, res, next)
			.then((accessToken?: AccessToken) => {
				userAccessToken = accessToken;
				return this._endpoint.hook.before(req.body, accessToken, req.params.id)
			})
			.then(() => { // this is the endpoint specific request handler
				blApiRequest = {
					documentId: req.params.id,
					query: req.query,
					data: req.body,
					user: {
						id: userAccessToken.sub,
						permission: userAccessToken.permission
					}
				};

				return this.onRequest(blApiRequest);
			})
			.then((docs: T[]) => this._collectionEndpointDocumentAuth.validate(this._endpoint, docs, blApiRequest))
			.then((docs: T[]) => this._endpoint.hook.after(docs, userAccessToken))
			.then((docs: T[]) => this._responseHandler.sendResponse(res, new BlapiResponse(docs)))
			.catch((blError: BlError) => this._responseHandler.sendErrorResponse(res, blError));
	}

	public onRequest(blApiRequest: BlApiRequest) {
		return Promise.resolve([]);
	}

	private routerGetAll() {
		this._router.get(this._collectionUri, this.handleRequest.bind(this));
	}

	private routerGetId() {
		this._router.get(this._collectionUri + '/:id' , this.handleRequest.bind(this));
	}

	private routerPost() {
		this._router.post(this._collectionUri, this.handleRequest.bind(this));
	}

	private routerDelete() {
		this._router.delete(this._collectionUri + '/:id', this.handleRequest.bind(this));
	}

	private routerPatch() {
		this._router.patch(this._collectionUri + '/:id', this.handleRequest.bind(this));
	}

	private routerPut() {
		this._router.put(this._collectionUri + '/:id', this.handleRequest.bind(this));
	}
}