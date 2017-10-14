
import {NumberFilter} from "./number-filter/db-query-number-filter";
import {StringFilter} from "./string-filter/db-query-string-filter";
import {OnlyGetFilter} from "./only-get-filter/db-query-only-get-filter";
import {SkipFilter} from "./skip-filter/db-query-skip-filter";
import {SortFilter} from "./sort-filter/db-query-sort-filter";
import {LimitFilter} from "./limit-filter/db-query-limit-filter";
import {RegexFilter} from "./regex-filter/db-query-regex-filter";
import {BooleanFilter} from "./boolean-filter/db-query-boolean-filter";

export class SEDbQuery {
	booleanFilters: BooleanFilter[];
	numberFilters: NumberFilter[];
	stringFilters: StringFilter[];
	onlyGetFilters: OnlyGetFilter[];
	skipFilter: SkipFilter;
	sortFilters: SortFilter[];
	limitFilter: LimitFilter;
	regexFilters: RegexFilter[];


	constructor() {
		this.booleanFilters = [];
		this.numberFilters = [];
		this.stringFilters = [];
		this.onlyGetFilters = [];
		this.skipFilter = {skip: 0};
		this.sortFilters = [];
		this.limitFilter = {limit: 0};
		this.regexFilters = [];
	}
}
