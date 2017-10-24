

export type User = {
	userDetail: string,
	permissions: string[],
	login: {
		provider: string,
		providerId: string
	},
	blid: string,
	username: string,
	active?: boolean,
	lastActive?: string,
	lastRequest?: string,
}
