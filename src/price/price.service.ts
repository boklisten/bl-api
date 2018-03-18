

export class PriceService {
	private up: boolean;
	
	constructor(roundUp?: boolean) {
		this.up = (roundUp) ? roundUp : false;
	}
	
	public sanitize(price: number): number {
		if (this.up) {
			return this.roundUp(price);
		}
		return this.roundDown(price);
	}
	
	private roundDown(num: number): number {
		return parseInt((num / 10).toString(), 10) * 10;
	}
	
	private roundUp(num: number): number {
		return parseInt((num / 10).toString(), 10) + 10;
	}
}