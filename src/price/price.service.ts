

export class PriceService {
	private up: boolean;
	private down: boolean;
	
	constructor(config?: {roundUp?: boolean, roundDown?: boolean}) {
		this.up = (config && config.roundUp) ? config.roundUp : false;
		this.down = (config && config.roundDown) ? config.roundDown : false;
	}
	
	public sanitize(price: number): number {
		if (this.up) {
			return this.roundUp(price);
		} else if (this.down) {
			return this.roundDown(price);
		} else {
			return price;
		}
	}
	
	private roundDown(num: number): number {
		return parseInt((num / 10).toString(), 10) * 10;
	}
	
	private roundUp(num: number): number {
		return parseInt((num / 10).toString(), 10) * 10 + 10;
	}
}