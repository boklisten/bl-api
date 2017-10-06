
export class SEDbQuery {
	filter: any;
	skip: number;
	sort: any;
	limit: number;
	onlyGet: any;

	constructor(filter: any, onlyGet: any, skip: any, sort: any, limit: any) {
		this.filter = filter;
		this.onlyGet = onlyGet;
		this.skip = skip;
		this.sort = sort;
		this.limit = limit;
	}

	hasFilter(): boolean {
		return (!this.filter);
	}

	hasOnlyGet(): boolean {
		return (!this.onlyGet);
	}

	hasSkip(): boolean {
		if (!this.skip) return false;
		if (this.skip <= 0) return false;
		return true;
	}

	hasSort(): boolean {
		return (!this.sort);
	}

	hasLimit(): boolean {
		if (!this.limit) return false;
		if (this.limit <= 0) return false;
		return true;
	}

}
