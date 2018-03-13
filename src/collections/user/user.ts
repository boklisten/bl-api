

import {UserPermission} from "../../auth/user/user-permission";

export type User = {
	id: string,
	userDetail: string,
	permission: UserPermission,
	login: {
		provider: string,
		providerId: string
	},
	blid: string,
	username: string,
	valid: boolean,
	user?: {
		id: string,
		permission: UserPermission
	}
	active?: boolean,
	lastActive?: string,
	lastRequest?: string,
}
