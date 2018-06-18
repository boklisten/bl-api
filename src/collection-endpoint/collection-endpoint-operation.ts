import {NextFunction, Request, Response, Router} from "express";
import {BlEndpointMethod, BlEndpointOperation} from "../collections/bl-collection";
import {CollectionEndpointAuth} from "./collection-endpoint-auth/collection-endpoint-auth";

import {SEResponseHandler} from "../response/se.response.handler";
import {AccessToken, BlapiResponse, BlError} from "@wizardcoder/bl-model";
import {BlApiRequest} from "../request/bl-api-request";

export class CollectionEndpointOperation {
	private _uri: string;
	private _collectionEndpointAuth: CollectionEndpointAuth;
	private _responseHandler: SEResponseHandler;

	constructor(protected _router: Router, private collectionUri: string, private _method: BlEndpointMethod, protected _operation: BlEndpointOperation) {
		this._uri = this.createUri(this.collectionUri, this._operation.name, _method);
		this._collectionEndpointAuth = new CollectionEndpointAuth();
		this._responseHandler = new SEResponseHandler();
	}

	public create() {
		let uri = this.createUri(this.collectionUri, this._operation.name, this._method);
		switch (this._method) {
			case 'getId':
				this._router.get(uri, this.handleRequest.bind(this));
				break;
			case 'patch':
				this._router.patch(uri, this.handleRequest.bind(this));
				break;
			default:
				throw new Error(`endpoint operation method "${this._method}" is currently not supported`);
		}
	}

	private createUri(collectionUri: string, operationName: string, operationMethod: BlEndpointMethod): string {
		let uri = collectionUri;
		if (operationMethod === 'getId' || operationMethod === 'patch' || operationMethod == 'delete') {
			uri += '/:id';
		}
		uri += '/' + operationName;
		return uri;
	}

	private handleRequest(req: Request, res: Response, next: NextFunction) {
		let blApiRequest: BlApiRequest;

		this._collectionEndpointAuth.authenticate(this._operation.restriction, req, res, next)
			.then((accessToken?: AccessToken) => {
				blApiRequest = {
					documentId: req.params.id,
					query: req.query,
					data: req.body,
					user: {
						id: accessToken.sub,
						permission: accessToken.permission
					}
				};

				return this._operation.operation.run(blApiRequest, req, res, next)
			})
			.catch((blError: BlError) => this._responseHandler.sendErrorResponse(res, blError));
	}

	private run(blapiRequest: BlApiRequest): any {
	}


}