import {BlDocument, BlError} from "@wizardcoder/bl-model";
import {Router} from "express";
import {BlCollection, BlEndpoint, BlEndpointRestriction} from "../collections/bl-collection";
import {BlDocumentStorage} from "../storage/blDocumentStorage";
import {SEResponseHandler} from "../response/se.response.handler";
import {PermissionService} from "../auth/permission/permission.service";
import {ApiPath} from "../config/api-path";
import {CollectionEndpointGetAll} from "./collection-endpoint-get-all/collection-endpoint-get-all";
import {CollectionEndpointGetId} from "./collection-endpoint-get-id/collection-endpoint-get-id";
import {CollectionEndpointPost} from "./collection-endpoint-post/collection-endpoint-post";
import {CollectionEndpointDelete} from "./collection-endpoint-delete/collection-endpoint-delete";
import {CollectionEndpointPatch} from "./collection-endpoint-patch/collection-endpoint-patch";
import chalk from "chalk";
import {Hook} from "../hook/hook";
import {logger} from "../logger/logger";


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
					this.createGetId(endpoint);
					break;
				case 'post':
					this.createPost(endpoint);
					break;
				case 'patch':
					this.createPatch(endpoint);
					break;
				case 'delete':
					this.createDelete(endpoint);
					break;
				default:
					throw new BlError(`the collection endpoint method "${endpoint.method}" is not supported`);
			}
		}
	}

	public printEndpoints() {
		for (const endpoint of this._collection.endpoints) {
			let method: string = endpoint.method;
			let uri = this._collection.collectionName;

			if (method === 'getAll' || method === 'getId') {
				method = 'get';
			}

			if (endpoint.method === 'getId' || endpoint.method === 'patch' || endpoint.method === 'delete' || endpoint.method === 'put') {
				uri += '/:id'
			}


			let output = chalk.dim.bold.yellow(method.toUpperCase()) + '\t' + chalk.dim.green(uri);



			logger.verbose(output + this.getRestrictionPrintout(endpoint.restriction));

			if (endpoint.operations) {
				for (let operation of endpoint.operations) {
					let operationOutput = output + chalk.dim.green('/' + operation.name) + this.getRestrictionPrintout(operation.restriction);
					logger.verbose(operationOutput);
				}
			}
		}
	}

	private getRestrictionPrintout(restriction: BlEndpointRestriction): string {
		let permissionService: PermissionService = new PermissionService();
		let output = '\t';

		if (restriction && restriction.permissions) {
			output += chalk.dim.bold.red('[' + permissionService.getLowestPermission(restriction.permissions) + ']');
		} else {
			output += chalk.dim.green('[everyone]');
		}

		output += '\t';

		if (restriction && restriction.restricted) {
			output += chalk.red.dim('user');
		}
		return output;
	}



	private createGetAll(endpoint: BlEndpoint) {
		const collectionEndpointGetAll = new CollectionEndpointGetAll<T>(this._router, endpoint, this._collection.collectionName, this._documentStorage);
		collectionEndpointGetAll.create();
	}

	private createGetId(endpoint: BlEndpoint) {
		const collectionEndpointGetId = new CollectionEndpointGetId<T>(this._router, endpoint, this._collection.collectionName, this._documentStorage);
		collectionEndpointGetId.create();
	}

	private createPost(endpoint: BlEndpoint) {
		const collectionEndpointPost = new CollectionEndpointPost<T>(this._router, endpoint, this._collection.collectionName, this._documentStorage);
		collectionEndpointPost.create();
	}

	private createDelete(endpoint: BlEndpoint) {
		const collectionEndpointDelete = new CollectionEndpointDelete<T>(this._router, endpoint, this._collection.collectionName, this._documentStorage);
		collectionEndpointDelete.create();
	}

	private createPatch(endpoint: BlEndpoint) {
		const collectionEndpointPatch = new CollectionEndpointPatch<T>(this._router, endpoint, this._collection.collectionName, this._documentStorage);
		collectionEndpointPatch.create();
	}
}