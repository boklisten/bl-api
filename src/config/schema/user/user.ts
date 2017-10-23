

export type User = {
	userDetail: string,
	permissionLevel: number,
	login: {
		provider: string,
		providerId: string
	}
	active?: boolean,
	lastActive?: string,
	lastRequest?: string,
}
