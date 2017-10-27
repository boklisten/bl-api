

import {UserPermission} from "../../../auth/user/user-permission";

export type User = {
	userDetail: string,
	permission: UserPermission,
	login: {
		provider: string,
		providerId: string
	},
	blid: string,
	username: string,
	valid: boolean,
	active?: boolean,
	lastActive?: string,
	lastRequest?: string,
}
