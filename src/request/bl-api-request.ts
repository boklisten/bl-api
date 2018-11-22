import {UserPermission} from "@wizardcoder/bl-model";

export class BlApiRequest {
	documentId?: string;
	query?: any;
	data?: any;
	user?: {
		id: string,
		permission: UserPermission
  };
}
