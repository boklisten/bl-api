
import {UserPermission} from "../../user/user-permission";

export type AccessToken = {
	iss: string,
	aud: string,
	exp: number,
	iat: number,
	sub: string,
	username: string,
	permission: UserPermission
}