import { BlDocument, BlError } from "@boklisten/bl-model";
import { BlApiRequest } from "../../request/bl-api-request";
import { isNullOrUndefined } from "util";
import { PermissionService } from "../../auth/permission/permission.service";
import {
  BlDocumentPermission,
  BlEndpointRestriction,
} from "../../collections/bl-collection";

export class CollectionEndpointDocumentAuth<T extends BlDocument> {
  private _permissionService: PermissionService;

  constructor() {
    this._permissionService = new PermissionService();
  }

  public validate(
    restriction: BlEndpointRestriction,
    docs: T[],
    blApiRequest: BlApiRequest,
    documentPermission?: BlDocumentPermission
  ): Promise<T[]> {
    if (restriction) {
      if (isNullOrUndefined(docs) || docs.length <= 0) {
        return Promise.reject(new BlError("docs is empty or undefined"));
      }

      if (isNullOrUndefined(blApiRequest)) {
        return Promise.reject(new BlError("blApiRequest is null or undefined"));
      }

      for (let doc of docs) {
        if (isNullOrUndefined(doc.viewableFor) || doc.viewableFor.length <= 0) {
          if (restriction.restricted) {
            if (
              !this._permissionService.haveRestrictedDocumentPermission(
                blApiRequest.user.id,
                blApiRequest.user.permission,
                doc,
                restriction,
                documentPermission
              )
            ) {
              return Promise.reject(
                new BlError(
                  "lacking restricted permission to view or edit the document"
                ).code(904)
              );
            }
          } else {
            //if (!this._permissionService.haveDocumentPermission(blApiRequest.user.permission, doc)) {
            //return Promise.reject(new BlError('lacking document permission to view or edit the document').code(904));
            //}
          }
        } else {
          let permissionValid = false;

          if (
            !this._permissionService.haveRestrictedDocumentPermission(
              blApiRequest.user.id,
              blApiRequest.user.permission,
              doc,
              restriction,
              documentPermission
            )
          ) {
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
            return Promise.reject(
              new BlError("document is not viewable for user")
                .store("userId", blApiRequest.user.id)
                .code(904)
            );
          }
        }
      }
    }

    return Promise.resolve(docs);
  }
}
