
export class DbQueryStringFilter {


	constructor() {}

	getStringFilters(query: any, validStringParams: string[]): any[] {

		if (!query || Object.keys(query).length === 0 && query.constructor === Object) {
			throw new TypeError('query can not be undefined or empty');
		}
		if (validStringParams.length <= 0) return [];

		let stringFilters: any[] = [];


		try {
			for (let param in query) {
				if (validStringParams.indexOf(param) > -1 ) {
					let stringFilter: any = {};
					stringFilter[param] = this.getStringParamValue(query[param]);
					stringFilters.push(stringFilter);
				}
			}

			return stringFilters;
		} catch (error) {
			if (error instanceof TypeError) {
				throw new TypeError('query includes bad string parameter data, reason: ' + error.message);
			}

			throw new Error('could not parse the string parameters in query, reason: ' + error.message);
		}
	}

	private getStringParamValue(param: string): string {
		if (this.validateStringParam(param)) {
			return param;
		}
		throw new TypeError('the paramterer of value "'+ param + '" is not a valid string');
	}

	private validateStringParam(param: string): boolean {
		if (!param) return false;
		if (!(typeof param === 'string')) return false;
		if (param.length <= 0) return false;
		return true;

	}
}