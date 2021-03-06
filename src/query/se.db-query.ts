import { NumberFilter } from "./number-filter/db-query-number-filter";
import { StringFilter } from "./string-filter/db-query-string-filter";
import { OnlyGetFilter } from "./only-get-filter/db-query-only-get-filter";
import { SkipFilter } from "./skip-filter/db-query-skip-filter";
import { SortFilter } from "./sort-filter/db-query-sort-filter";
import { LimitFilter } from "./limit-filter/db-query-limit-filter";
import { RegexFilter } from "./regex-filter/db-query-regex-filter";
import { BooleanFilter } from "./boolean-filter/db-query-boolean-filter";
import { DateFilter } from "./date-filter/db-query-date-filter";
import { ExpandFilter } from "./expand-filter/db-query-expand-filter";
import { ObjectIdFilter } from "./object-id-filter/db-query-object-id-filter";

export class SEDbQuery {
  booleanFilters: BooleanFilter[];
  dateFilters: DateFilter[];
  numberFilters: NumberFilter[];
  stringFilters: StringFilter[];
  objectIdFilters: ObjectIdFilter[];
  onlyGetFilters: OnlyGetFilter[];
  skipFilter: SkipFilter;
  sortFilters: SortFilter[];
  limitFilter: LimitFilter;
  regexFilters: RegexFilter[];
  expandFilters: ExpandFilter[];

  constructor() {
    this.booleanFilters = [];
    this.dateFilters = [];
    this.numberFilters = [];
    this.stringFilters = [];
    this.objectIdFilters = [];
    this.onlyGetFilters = [];
    this.skipFilter = { skip: 0 };
    this.sortFilters = [];
    this.limitFilter = { limit: 0 };
    this.regexFilters = [];
    this.expandFilters = [];
  }

  getFilter(): any {
    let filterObj: any = {};
    let orArr: any = [];

    for (let booleanFilter of this.booleanFilters) {
      filterObj[booleanFilter.fieldName] = booleanFilter.value;
    }

    for (let dateFilter of this.dateFilters) {
      filterObj[dateFilter.fieldName] = dateFilter.op;
    }

    for (let numberFilter of this.numberFilters) {
      filterObj[numberFilter.fieldName] = numberFilter.op;
    }

    for (let stringFilter of this.stringFilters) {
      if (Array.isArray(stringFilter.value)) {
        let arr = stringFilter.value;
        for (let stringValue of arr) {
          let multipleValuesFilterObj: any = {};
          multipleValuesFilterObj[stringFilter.fieldName] = stringValue;
          orArr.push(multipleValuesFilterObj);
        }
      } else {
        filterObj[stringFilter.fieldName] = stringFilter.value;
      }
    }

    for (let objectIdFilter of this.objectIdFilters) {
      if (Array.isArray(objectIdFilter.value)) {
        let arr = objectIdFilter.value;
        for (let stringValue of arr) {
          let multipleValuesFilterObj: any = {};
          multipleValuesFilterObj[objectIdFilter.fieldName] = stringValue;
          orArr.push(multipleValuesFilterObj);
        }
      } else {
        filterObj[objectIdFilter.fieldName] = objectIdFilter.value;
      }
    }

    for (let regexFilter of this.regexFilters) {
      let regexFilterObj: any = {};
      regexFilterObj[regexFilter.fieldName] = regexFilter.op;
      orArr.push(regexFilterObj);
    }

    if (orArr.length > 0) {
      filterObj["$or"] = orArr;
    }

    return filterObj;
  }

  getOgFilter(): any {
    let ogFilterObj: any = {};

    for (let ogFilter of this.onlyGetFilters) {
      ogFilterObj[ogFilter.fieldName] = ogFilter.value;
    }
    return ogFilterObj;
  }

  getLimitFilter(): number {
    return this.limitFilter.limit;
  }

  getSkipFilter(): number {
    return this.skipFilter.skip;
  }

  getExpandFilter() {
    return this.expandFilters;
  }

  getSortFilter(): any {
    let sortFilterObj: any = {};

    for (let sortFilter of this.sortFilters) {
      sortFilterObj[sortFilter.fieldName] = sortFilter.direction;
    }

    return sortFilterObj;
  }
}
