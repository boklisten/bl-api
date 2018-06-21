
export class RefreshTokenSecret {
	
	get(): string {
		return (process.env.REFRESH_TOKEN_SECRET || 'secretly a string is just chars');
	}
}