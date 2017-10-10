

import {error} from "util";

export class DbQueryNumberFilter {

	private operationIdentifiers = [
		{op: '$gt', opIdentifier: '>', atIndex: 0},
		{op: '$lt', opIdentifier: '<', atIndex: 0}
	];

	private operationEqualTo = '$eq';

	constructor() {}

	public getNumberFilters(query: any, validNumberParams: string[]) {
		let numberFilters = [];

		if (!query || (Object.keys(query).length === 0 && query.constructor === Object)) throw new TypeError('the given query can not be null or undefined');
		if (validNumberParams.length <= 0) return [];

		try {
			for (let key in query) {

				if (validNumberParams.indexOf(key) > -1) {
					let numberFilterValue: any = {};

					if (Array.isArray(query[key])) {
						numberFilterValue = this.generateNumberFilterForArray(query[key]);
					} else {
						numberFilterValue = this.generateNumberFilter(query[key]);
					}

					let numberFilter: any = {};
					numberFilter[key] = numberFilterValue;

					numberFilters.push(numberFilter);
				}
			}

			return numberFilters;
		} catch (error) {
			if (error instanceof TypeError) throw new TypeError('query includes bad number data, reason: ' + error.message);
			if (error instanceof SyntaxError) throw new SyntaxError('query includes syntax errors, reason: ' + error.message);
			throw new Error('failure when parsing query for number operations');

		}
	}

	private generateNumberFilter(value: string): any {
		if (!value) throw new Error('QueryBuilderNumberFilter.generateNumberFilter(): value is not defined');

		if (this.valueHasOperationIdentifier(value)) {
			let valueFilterObj: any = {};
			let opWithValue = this.getOperationWithValue(value);
			valueFilterObj[opWithValue.operation] = opWithValue.value;
			return valueFilterObj;
		}


		return this.extractNumberFromQueryString(value);
	}

	private generateNumberFilterForArray(values: string[]): any {
		if (values.length <= 0) throw new RangeError('the supplied array is empty');

		let numberFilterObj: any = {};

		for (let value of values) {
			numberFilterObj = this.addOperationWithValueToFilterObj(numberFilterObj, value);
		}

		return numberFilterObj;
	}

	private addOperationWithValueToFilterObj(filterObj: any, value: string): any {
		if (this.valueHasOperationIdentifier(value)) {
			let operationWithValue = this.getOperationWithValue(value);
			filterObj[operationWithValue.operation] = operationWithValue.value;
		} else {
			throw new SyntaxError('can not have "$eq" operation together with other operations');
		}
		return filterObj;
	}

	private getNumberEqualToWithValue(value: string): {operation: string, value: string} {
		return {operation: this.operationEqualTo, value: value};
	}

	private valueHasOperationIdentifier(value: string): boolean {
		for (let operationIdentifiers of this.operationIdentifiers) {
			if (value.length >= operationIdentifiers.atIndex) {
				if (operationIdentifiers.opIdentifier === value[operationIdentifiers.atIndex]) return true;
			}
		}
		return false;
	}

	private getOperationWithValue(value: string): {operation: string, value: number} {
		return {
			operation: this.getOperation(value),
			value: this.extractNumberFromQueryString(value.substr(1, value.length))
		}
	}

	private getOperation(value: string): string {

		for (let operationIdentifier of this.operationIdentifiers) {
			if (value.length >=  operationIdentifier.atIndex) {
				if (operationIdentifier.opIdentifier === value[operationIdentifier.atIndex]) {
					return operationIdentifier.op;
				}
			}
		}

		throw new ReferenceError('could not find any valid operations in the value "' + value + '"');
	}


	private extractNumberFromQueryString(num: string): number {
		for (let n of num) {
			if (isNaN(parseInt(n, 10)))  throw TypeError('value "'+ num+'" is not a valid number');
		}
		return parseInt(num, 10);
	}
}
