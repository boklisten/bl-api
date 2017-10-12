
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

	getRegexFilters(searchString: string, validRegexParams: string[]): RegexFilter[] {

		if (!searchString) throw new ReferenceError('searchString is not defined');
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
