
export type RegexFilter = {
	fieldName: string,
	op: {
		$regex: string,
		$options: string
	}
}

export class DbQueryRegexFilter {

	constructor() {

	}

	getRegexFilters(query: any, validRegexParams: string[]): RegexFilter[] {
		if (!query || Object.keys(query).length === 0 && query.constructor === Object) {
			throw new TypeError('query can not be undefined or empty');
		}

		let searchString = query.s;

		if (!searchString) return [];
		if (searchString.length < 3) throw new TypeError('search string "' + searchString+ '" is under 3 chars long');

		return this.generateRegexFilters(searchString, validRegexParams);
	}

	private generateRegexFilters(searchString: string, validRegexParams: string[]): RegexFilter[] {
		let regexFilters: RegexFilter[]  = [];

		for (let validRegexParam of validRegexParams) {
			regexFilters.push({fieldName: validRegexParam, op: {$regex: searchString, $options: 'imx'}});
		}

		return regexFilters;
	}
}
