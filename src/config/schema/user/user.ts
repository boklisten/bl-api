

export type User = {
	userType: "customer" | "employee",
	userDetail: string,
	permissionLevel: number,
	emailToken: string
	token?: string,
	active?: boolean,
	lastActive?: string,
	lastRequest?: string,
}
