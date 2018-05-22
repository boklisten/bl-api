import {AccessToken, BlDocument, BlError} from "@wizardcoder/bl-model";
import {BlApiRequest} from "../../request/bl-api-request";
import {isNullOrUndefined} from "util";
import {PermissionService} from "../../auth/permission/permission.service";
import {BlEndpoint} from "../../collections/bl-collection";


export class CollectionEndpointDocumentAuth<T extends BlDocument> {
	private _permissionService: PermissionService;

	constructor() {
		this._permissionService = new PermissionService();
	}

	public validate(endpoint: BlEndpoint, docs: T[], blApiRequest: BlApiRequest): Promise<T[]> {
		if (endpoint.restriction) {
			if (isNullOrUndefined(docs) || docs.length <= 0) {
				return Promise.reject(new BlError('docs is empty or undefined'));
			}

			if (isNullOrUndefined(blApiRequest)) {
				return Promise.reject(new BlError('blApiRequest is null or undefined'));
			}

			for (let doc of docs) {
				if (isNullOrUndefined(doc.viewableFor) || doc.viewableFor.length <= 0) {
					if (!this._permissionService.haveRestrictedPermission(blApiRequest.user.id, blApiRequest.user.permission, doc)) {
						return Promise.reject(new BlError('user does not have the permission to view the document').code(904));
					}
				} else {
					let permissionValid = false;

					if (!this._permissionService.haveRestrictedPermission(blApiRequest.user.id, blApiRequest.user.permission, doc)) {
						for (let id of doc.viewableFor) {
							if (id.toString() === blApiRequest.user.id.toString()) {
								permissionValid = true;
								break;
							}
						}
					} else {
						permissionValid = true;
					}

					if (!permissionValid) {
						return Promise.reject(new BlError('document is not viewable for user').store('userId', blApiRequest.user.id).code(904));
					}
				}
			}
		}


		return Promise.resolve(docs);
	}
}