
import {Request} from 'express';
import {SEErrorResponse} from "../response/se.error.response";
import {connect} from "mongodb";
import {SEDbQuery} from "./se.db-query";

export class SEDbQueryBuilder {

	$or: any[];
	limit: number;
	skip: number;
	sort: any;
	onlyGet: any;
	validParams: string[];

	constructor() {
		this.clearData();
	}

	public getDbQuery(query: any, validSearchParams: string[]): Promise<SEDbQuery> {
		this.clearData();
		this.validParams = validSearchParams;
		return new Promise((resolve, reject) => {
			if (!this.sanitizeQuery(query)) {
				reject(new SEErrorResponse(402, 'query not valid'));
				return;
			}
			resolve(new SEDbQuery(this.createFilter(), this.onlyGet, this.skip, this.sort, this.limit));
		});
	}

	private clearData() {
		this.$or = [];
		this.limit = 0;
		this.skip = 0;
		this.sort = {};
		this.onlyGet = {};
		this.validParams = [];
	}

	private createFilter() {
		let filter: any = {};
		if (this.$or.length > 0) {
			filter.$or = this.$or;
		}

		return filter;

	}

	private sanitizeQuery(query: any): boolean {
		if (!this.setSearchString(query.s)) return false;
		if (!this.setLimit(query.limit)) return false;
		if (!this.setOnlyGet(query.og)) return false;
		if (!this.setSkip(query.skip)) return false;
		if (!this.setSort(query.sort)) return false;
		return true;
	}

	isValidSearchParam(param: string): boolean {
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

	getBaseSearchParams(): string[] {
		let baseParams: string[] = [];
		for (let validParam of this.validParams) {
			if (validParam[validParam.length-1] === '*' && validParam.length >= 2) {
				baseParams.push(validParam.substr(0, validParam.length-2	));
			} else {
				baseParams.push(validParam);
			}
		}
		return baseParams;


	}

	setSearchString(s: any): boolean {
		if (s) {
			if (!this.validateString(s)) return false;
			if (s.length < 3) return false;

			for (let field of this.getBaseSearchParams()) {
				let orObj: any = {};
				orObj[field] =  { $regex: new RegExp(s), $options: 'imx'};

				this.$or.push(orObj);
			}
		}
		return true;
	}

	setLimit(limit: any): boolean {
		if (limit) {
			if (!this.validateString(limit)) return false;

			let lim = 0;
			try  {
				lim = parseInt(limit);
			} catch(error) {
				return false;
			}

			if (lim <= 0) return false;

			this.limit = lim;
		}
		return true;
	}

	setOnlyGet(og: any): boolean {
		if (og) {
			if (!this.validateString(og)) return false;
			let oglist = og.split(',');

			for (let token of oglist) {
				if (!this.isValidSearchParam(token)) return false;
				this.onlyGet[token] = 1;
			}
		}
		return true;
	}

	setSkip(skip: any): boolean {
		if (skip) {
			if (!this.validateString(skip)) return false;
			let sk = 0;
			try {
				sk = parseInt(skip);
			} catch (error) {
				return false;
			}

			if (sk < 0) return false;

			this.skip = sk;
		}
		return true
	}

	setSort(sort: any): boolean {
		if (sort) {
			let direction = 1;

			if (!this.validateString(sort)) return false;
			if (sort[0] === '-' && sort.length > 1) {
				direction = -1;
				sort = sort.substr(1, sort.length - 1);
			}

			if (!this.isValidSearchParam(sort)) return false;

			this.sort[sort] = direction;

		}

		return true;
	}

	private validateString(s: any): boolean {
		if (!s) return false;
		if (!(typeof s === 'string')) return false;
		if (s.length <= 0) return false;
		return true;

	}

}
