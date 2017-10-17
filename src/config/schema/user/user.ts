

export type User = {
	userType: "customer" | "employee",
	lastActive: string,
	lastRequest: string,
	userDetail: string,
	token: string,
	permissionLevel: number,
	active: boolean,
	emailToken: string
}
