
export type RefreshToken = {
	iss: string,
	aud: string,
	exp: number,
	iat: number,
	sub: string,
	username: string
}