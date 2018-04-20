
import {Hook} from "../hook/hook";
import {UserPermission} from "@wizardcoder/bl-model";
import {ValidParam} from "../query/valid-param/db-query-valid-params";


export interface BlCollection {
	collectionName: string; //the name determines the path to the collection like /api/vi/collectionName
	mongooseSchema: any; //the mongooseSchema for this collection
	endpoints: BlEndpoint[]; //a list of the valid endpoints for this collection;
}

export interface BlEndpoint {
	method: "getAll" | "getId" | "getQuery" | "post" | "put" | "patch" | "delete",
	hook?: Hook //an optional hook for this endpoint
	validQueryParams?: ValidParam[]
	restriction?: { //what type of user can access this endpoint, if set a user must login at minimum
		permissions: UserPermission[], //a list of the permission the user needs
		restricted?: boolean //if set this endpoint is restricted to the user or for a user with higher permission
		secured?: boolean //this endpoint is only accessible to the user that created it
	}
}

