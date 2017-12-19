
import {UserPermission} from "../../user/user-permission";

export type AccessToken = {
	iss: string,
	aud: string,
	expiresIn: string,
	iat: number,
	sub: string,
	username: string,
	permission: UserPermission,
	details: string
}