
export class SEDbQuery {
	filter: any;
	skip: number;
	sort: any;
	limit: number;
	onlyGet: any;

	numberFilters: any[];
	stringFilters: any[];


	constructor(filter: any, onlyGet: any, skip: any, sort: any, limit: any) {
		this.filter = filter;
		this.onlyGet = onlyGet;
		this.skip = skip;
		this.sort = sort;
		this.limit = limit;
	}
}
