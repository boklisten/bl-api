

export type UserDetail = {
	name: string,
	email?: string,
	phone?: string,
	address?: string,
	postCode?: string,
	postCity?: string,
	country?: string,
	emailConfirmed?: boolean,
	dob?: Date,
	branch?: string,
	lastActive?: Date,
	guardian?: {
		name: string,
		email: string,
		emailConfirmed: boolean,
		phone: number,
		confirmed: boolean
	}
}

