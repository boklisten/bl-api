import moment = require("moment");


export type DateFilter = {
	fieldName: string,
	op: {
		$lt?: string,
		$gt?: string
	}
}

export class DbQueryDateFilter {
	private operationIdentifiers: {op: string, opIdentifier: string, atIndex: number}[];

	private dateFormat: string;

	public constructor() {
		this.dateFormat = 'DDMMYYYYHHmm';
		this.operationIdentifiers = [
			{op: '$gt', opIdentifier: '>', atIndex: 0},
			{op: '$lt', opIdentifier: '<', atIndex: 0}
		];
	}

	public getDateFilters(query: any, validDateParams: string[]): DateFilter[] {
		if (!query || (Object.keys(query).length === 0 && query.constructor === Object)) throw new TypeError('the given query can not be null or undefined');

		try {
			for (let param in query) {
				if (query.hasOwnProperty(param)) {
					if (validDateParams.indexOf(param) > -1) {
						let dateFilter: DateFilter;

						if (Array.isArray(query[param])) {
							return this.generateMultipleDateFilter(param, query[param]);
						} else {
							return this.generateSingleDayFilter(param, query[param]);
						}
					}
				}
			}

			return [];
		} catch (e) {
			if (e instanceof SyntaxError) {
				throw new SyntaxError();
			}
		}
	}

	private generateSingleDayFilter(fieldName: string, value: string): DateFilter[] {
		if (!value) throw new Error('QueryBuilderDateFilter.generateDateFilter(): value is not defined');

		let momentDate;
		try {
			momentDate = moment(value, this.dateFormat, true);
		} catch (e) {
			throw new SyntaxError('generateDateFilter(): invalid date');
		}

		if (!momentDate.isValid()) {
			throw new SyntaxError('generateDateFilter(): invalid date');
		}

		let gtIsoDate = momentDate.subtract(1, 'day').toISOString();
		let lessThanIsoDate = momentDate.add(1, 'day').toISOString();

		return [{fieldName: fieldName, op: {$gt: gtIsoDate, $lt: lessThanIsoDate}}];
	}

	private generateMultipleDateFilter(fieldName: string, values: string[]): DateFilter[] {
		let operations = {};

		for (let value of values) {
			let op = this.getOperation(value);
			let theDateString = value.substr(1, value.length);
			operations[op] = moment(theDateString, this.dateFormat, true).toISOString();
		}

		return [{fieldName: fieldName, op: operations}];
	}

	private getOperation(value: string): string {
		for (let operationIdentifier of this.operationIdentifiers) {
			if (value.length >= operationIdentifier.atIndex) {
				if (operationIdentifier.opIdentifier === value[operationIdentifier.atIndex]) {
					return operationIdentifier.op;
				}
			}
		}
	}
}
