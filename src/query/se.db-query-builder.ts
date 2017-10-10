
import {SEErrorResponse} from "../response/se.error.response";
import {SEDbQuery} from "./se.db-query";
import {DbQueryNumberFilter} from "./number-filter/db-query-number-filter";

export class SEDbQueryBuilder {
	validParams: string[];
	private dbQueryNumberFilter: DbQueryNumberFilter;

	constructor() {

		this.dbQueryNumberFilter = new DbQueryNumberFilter();

	}

	public getDbQuery(query: any, validSearchParams: string[]): Promise<SEDbQuery> {
		this.validParams = validSearchParams;
		return new Promise((resolve, reject) => {
			try {
				let dbQuery = this.makeDbQuery(query);

				resolve(dbQuery);

			} catch (error) {
				reject(new SEErrorResponse(402, 'query not valid'));
			}
		});
	}

	private makeDbQuery(query: any): SEDbQuery {
		try {
			let filter = this.createFilter(query);
			let limit = this.createLimit(query);
			let onlyGet = this.createOnlyGet(query);
			let skip = this.createSkip(query);
			let sort = this.createSort(query);
			return new SEDbQuery(filter, onlyGet, skip, sort, limit);
		} catch (error) {
			throw new Error('could not create query: ' + '\n\t> ' + error.message);
		}
	}

	private createFilter(query: any): any {
		let filter: any = {};
		let searchParamList = this.getSearchParamList(query);

		if (searchParamList.length > 0) {
			filter.$or = searchParamList;
		}

		for (let keyval of this.getFilterParams(query)) {
			filter[keyval.key] = keyval.val;
		}

		let numberFilters = this.dbQueryNumberFilter.getNumberFilters(query, ['price']);

		return filter;
	}

	private isValidSearchParam(param: string): boolean {

		for (let validParam of this.validParams) {
			if (validParam[validParam.length-1] === '*' && validParam.length >= 2) {
				let vp = validParam.substr(0, validParam.length-1);
				if (param.indexOf('.') > -1) {
					let ps = param.split('.');
					if (vp === ps[0]) return true;
				} else {
					if (vp === param) return true;
				}
			} else {
				if (param === validParam) return true;
			}
		}
		return false;
	}

	private getBaseSearchParams(): string[] {
		let baseParams: string[] = [];

		for (let validParam of this.validParams) {
			if (validParam[validParam.length-1] === '*' && validParam.length >= 2) {
				baseParams.push(validParam.substr(0, validParam.length-1	));
			} else {
				baseParams.push(validParam);
			}
		}
		return baseParams;
	}

	private getFilterParams(query: any): {key: string, val: string}[] {
		let filterParams: {key: string, val: string}[] = [];

		for (let key in query) {
			if (key.indexOf('.') > -1) {
				let k = key.substr(0, key.length-1);
				if (this.getBaseSearchParams().indexOf(k) > -1) {
					filterParams.push({key: key, val: query[key]});
				}
			} else {
				if (this.getBaseSearchParams().indexOf(key) > -1) {
					filterParams.push({key: key, val: query[key]});
				}
			}
		}
		return filterParams;
	}

	private getSearchParamList(query: any): string[] {
		let searchParamList: string[] = [];

		if (query.s) {
			if (!this.validateString(query.s)) throw new Error('search string "' + query.s + '" not valid');
			if (query.s.length < 3) throw new Error('search string "' + query.s + '" to short, must be over or equal to 3 chars')

			for (let field of this.getBaseSearchParams()) {
				let orObj: any = {};
				orObj[field] =  { $regex: new RegExp(query.s), $options: 'imx'};
				searchParamList.push(orObj);
			}
		}
		return searchParamList;
	}

	private createLimit(query: any): number {
		let lim = 0;

		if (query.limit) {
			if (!this.validateString(query.limit)) throw new Error('limit string "' + query.limit +'" is not valid');

			try  {
				lim = parseInt(query.limit);
			} catch(error) {
				throw new Error('could not create limit, could not parse "' + query.limit + '" to int');
			}

			if (lim <= 0) throw new Error('failed to create limit, limit cant be under 0, it was: ' + lim);
		}

		return lim;
	}

	private createOnlyGet(query: any): any {
		let onlyGet: any = {};

		if (query.og) {
			if (!this.validateString(query.og)) throw new Error('the onlyGet sting "'+ query.og +'" is not valid');
			let oglist = query.og.split(',');

			for (let token of oglist) {
				if (!this.isValidSearchParam(token)) throw new Error('the token "' + token + '" in the onlyGet string' +
					' is not a valid search param');
				onlyGet[token] = 1;
			}
		}
		return onlyGet;
	}

	private createSkip(query: any): number {
		let skip = 0;

		if (query.skip) {
			if (!this.validateString(query.skip)) throw new Error('the skip string "' + query.skip + '" is not valid');
			try {
				skip = parseInt(query.skip);
			} catch (error) {
				throw new Error('skip string "' + query.skip +'" could not be parsed to int');
			}

			if (skip < 0) throw new Error('skip number cant be under 0, here it was: ' + skip);
		}
		return skip;
	}

	private createSort(query: any): any {
		let sort: any = {};

		if (query.sort) {
			let direction = 1;
			let sortParam = '';

			if (!this.validateString(query.sort)) throw new Error('sort string "' + query.sort + '" is not valid');
			if (query.sort[0] === '-' && query.sort.length > 1) {
				direction = -1;
				sortParam = query.sort.substr(1, query.sort.length - 1);
			} else {
				sortParam = query.sort;
			}
			if (!this.isValidSearchParam(sortParam)) throw new Error('sort parameter "' + sortParam + '" is not a valid search param');

			sort[sortParam] = direction;
		}
		return sort;
	}

	private validateString(s: any): boolean {
		if (!s) return false;
		if (!(typeof s === 'string')) return false;
		if (s.length <= 0) return false;
		return true;
	}
}
