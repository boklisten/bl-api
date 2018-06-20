
export class AccessTokenSecret {
	constructor() {
	
	}
	
	public get(): string {
		return process.env.ACCESS_TOKEN_SECRET;
	}
}