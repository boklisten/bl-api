import {CollectionEndpointAuth} from "./collection-endpoint-auth/collection-endpoint-auth";
import {SEResponseHandler} from "../response/se.response.handler";
import {NextFunction, Request, Response, Router} from "express";
import {BlDocumentPermission, BlEndpoint} from "../collections/bl-collection";
import {ApiPath} from "../config/api-path";
import {AccessToken, BlapiResponse, BlDocument, BlError} from "@wizardcoder/bl-model";
import {Hook} from "../hook/hook";
import {BlDocumentStorage} from "../storage/blDocumentStorage";
import {BlApiRequest} from "../request/bl-api-request";
import {CollectionEndpointDocumentAuth} from "./collection-endpoint-document/collection-endpoint-document-auth";
import {CollectionEndpointOperation} from "./collection-endpoint-operation";
import {isBoolean, isNullOrUndefined} from "util";

declare var onRequest: any;

export class CollectionEndpointMethod<T extends BlDocument> {
	protected _collectionUri: string;
	protected _collectionEndpointAuth: CollectionEndpointAuth;
	protected _responseHandler: SEResponseHandler;
	protected _collectionEndpointDocumentAuth: CollectionEndpointDocumentAuth<T>;


	constructor(protected _router: Router, protected _endpoint: BlEndpoint, protected _collectionName: string, protected _documentStorage: BlDocumentStorage<T>, protected documentPermission?: BlDocumentPermission) {
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

		this.createOperations(this._endpoint);
	}

	public onRequest(blApiRequest: BlApiRequest) {
		return Promise.resolve([]);
	}

	private createOperations(endpoint: BlEndpoint) {
		if (endpoint.operations) {
			for (let operation of endpoint.operations) {
				let collectionEndpointOperation = new CollectionEndpointOperation(this._router, this._collectionUri, endpoint.method, operation);
				collectionEndpointOperation.create();
			}
		}
	}

	private handleRequest(req: Request, res: Response, next: NextFunction) {
		let userAccessToken: AccessToken;
		let blApiRequest: BlApiRequest;

		this._collectionEndpointAuth.authenticate(this._endpoint.restriction, req, res, next)
			.then((accessToken?: AccessToken) => {
				userAccessToken = accessToken;
				return this._endpoint.hook.before(req.body, accessToken, req.params.id)
			})
			.then((hookData?: any) => { // this is the endpoint specific request handler
				let data = req.body;

				if (!isNullOrUndefined(hookData) && !isBoolean(hookData)) {
					data = hookData;
				}

				blApiRequest = {
					documentId: req.params.id,
					query: req.query,
					data: data,
					user: {
						id: userAccessToken.sub,
						permission: userAccessToken.permission
					}
				};

				return this.onRequest(blApiRequest);
			})
			.then((docs: T[]) => this._collectionEndpointDocumentAuth.validate(this._endpoint.restriction, docs, blApiRequest, this.documentPermission))
			.then((docs: T[]) => this._endpoint.hook.after(docs, userAccessToken))
			.then((docs: T[]) => this._responseHandler.sendResponse(res, new BlapiResponse(docs)))
			.catch((blError: BlError) => this._responseHandler.sendErrorResponse(res, blError));
	}

	private routerGetAll() {
		this._router.get(this._collectionUri, this.handleRequest.bind(this));
	}

	private routerGetId() {
		this._router.get(this._collectionUri + '/:id', this.handleRequest.bind(this));
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