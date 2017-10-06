
import {Request} from 'express';
import {SEErrorResponse} from "../response/se.error.response";
import {connect} from "mongodb";
import {SEDbQuery} from "./se.db-query";

export class SEDbQueryBuilder {

	$or: any[];
	limit: number;
	filter: any;
	skip: number;
	sort: any;
	onlyGet: any;

	constructor() {
		this.clearData();
	}

	public getDbQuery(query: any, validFields: string[]): Promise<SEDbQuery> {
		this.clearData();
		return new Promise((resolve, reject) => {
			if (!this.sanitizeQuery(query, validFields)) {
				reject(new SEErrorResponse(402, 'query not valid'));
				return;
			}
			resolve(new SEDbQuery(this.filter, this.onlyGet, this.skip, this.sort, this.limit));

		});
	}

	private clearData() {
		this.$or = [];
		this.limit = 0;
		this.filter = {};
		this.skip = 0;
		this.sort = {};
		this.onlyGet = {};
	}

	private sanitizeQuery(query: any, validFields: string[]): boolean {
		if (!this.setSearchString(query.s, validFields)) return false;
		if (!this.setLimit(query.limit)) return false;
		if (!this.setOnlyGet(query.og, validFields)) return false;
		if (!this.setSkip(query.skip)) return false;
		if (!this.setSort(query.sort, validFields)) return false;
		return true;
	}

	setSearchString(s: any, validFields: string[]): boolean {
		if (s) {
			if (!this.validateString(s)) return false;
			if (s.length < 3) return false;

			for (let field of validFields) {
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

	setOnlyGet(og: any, validFields: string[]): boolean {
		if (og) {
			if (!this.validateString(og)) return false;
			let oglist = og.split(',');

			for (let token of oglist) {
				if (validFields.indexOf(token) <= -1) return false;
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

	setSort(sort: any, validFileds: string[]): boolean {
		if (sort) {
			let direction = 1;

			if (!this.validateString(sort)) return false;
			if (sort[0] === '-' && sort.length > 1) {
				direction = -1;
				sort = sort.substr(1, sort.length - 1);
			}

			if (validFileds.indexOf(sort) <= -1) return false;

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
