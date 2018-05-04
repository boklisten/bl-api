import {BlDocument, BlError} from "@wizardcoder/bl-model";
import {Router} from "express";
import {BlCollection, BlEndpoint} from "../collections/bl-collection";
import {BlDocumentStorage} from "../storage/blDocumentStorage";
import {SEResponseHandler} from "../response/se.response.handler";
import {PermissionService} from "../auth/permission/permission.service";
import {ApiPath} from "../config/api-path";
import {CollectionEndpointGetAll} from "./collection-endpoint-get-all/collection-endpoint-get-all";


export class CollectionEndpoint<T extends BlDocument> {
	private _documentStorage: BlDocumentStorage<T>;
	private _permissionService: PermissionService;
	private _apiPath: ApiPath;

	constructor(private _router: Router, private _collection: BlCollection, private _responseHandler: SEResponseHandler) {
		this._documentStorage = new BlDocumentStorage<T>(_collection.collectionName, _collection.mongooseSchema);
		this._permissionService = new PermissionService();
		this._apiPath = new ApiPath();
	}

	public create() {
		for (const endpoint of this._collection.endpoints) {
			switch (endpoint.method) {
				case 'getAll':
					this.createGetAll(endpoint);
					break;
				case 'getId':
					break;
				case 'post':
					break;
				case 'patch':
					break;
				case 'delete':
					break;
				default:
					throw new BlError(`the collection endpoint method "${endpoint.method}" is not supported`);
			}
		}
	}

	private createGetAll(endpoint: BlEndpoint) {
		const collectionEndpointGetAll = new CollectionEndpointGetAll<T>(this._router, endpoint, this._documentStorage, this._collection.collectionName);
		collectionEndpointGetAll.create();
	}
}