

export type Customer = {

	name: string,
	phone: string,
	address: string,
	postCode: string,
	postCity: string,
	country: string,
	email: string,
	dob: string,
	branch: string,
	guardian: {
		name: string,
		email: string,
		phone: number,
	}

}
