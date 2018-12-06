


export type SkipFilter = {
	skip: number;
}


export class DbQuerySkipFilter {
	constructor() {}

	public getSkipFilter(query: any): SkipFilter {
		if (!query || Object.keys(query).length === 0 && query.constructor === Object) {
			throw new TypeError('query can not be undefined or empty');
		}

		if (!query.skip) return {skip: 0};

		return {skip: this.getSkipNumber(query.skip)}
	}


	private getSkipNumber(skip: any): number {
		let skipstr = skip.toString();

		for (let s of skipstr) {
			if (s !== "0" && !parseInt(s)) throw new TypeError('skip parameter "' + skip + '" is not a valid number');
		}

		return parseInt(skipstr);
	}
}
