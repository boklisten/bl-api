/* eslint-disable @typescript-eslint/no-explicit-any */
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
    const filterObj: any = {};
    const orArr: any = [];

    for (const booleanFilter of this.booleanFilters) {
      filterObj[booleanFilter.fieldName] = booleanFilter.value;
    }

    for (const dateFilter of this.dateFilters) {
      filterObj[dateFilter.fieldName] = dateFilter.op;
    }

    for (const numberFilter of this.numberFilters) {
      filterObj[numberFilter.fieldName] = numberFilter.op;
    }

    for (const stringFilter of this.stringFilters) {
      if (Array.isArray(stringFilter.value)) {
        const arr = stringFilter.value;
        for (const stringValue of arr) {
          const multipleValuesFilterObj: any = {};
          multipleValuesFilterObj[stringFilter.fieldName] = stringValue;
          orArr.push(multipleValuesFilterObj);
        }
      } else {
        filterObj[stringFilter.fieldName] = stringFilter.value;
      }
    }

    for (const objectIdFilter of this.objectIdFilters) {
      if (Array.isArray(objectIdFilter.value)) {
        const arr = objectIdFilter.value;
        for (const stringValue of arr) {
          const multipleValuesFilterObj: any = {};
          multipleValuesFilterObj[objectIdFilter.fieldName] = stringValue;
          orArr.push(multipleValuesFilterObj);
        }
      } else {
        filterObj[objectIdFilter.fieldName] = objectIdFilter.value;
      }
    }

    for (const regexFilter of this.regexFilters) {
      const regexFilterObj: any = {};
      regexFilterObj[regexFilter.fieldName] = regexFilter.op;
      orArr.push(regexFilterObj);
    }

    if (orArr.length > 0) {
      filterObj["$or"] = orArr;
    }

    return filterObj;
  }

  getOgFilter(): any {
    const ogFilterObj: any = {};

    for (const ogFilter of this.onlyGetFilters) {
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
    const sortFilterObj: any = {};

    for (const sortFilter of this.sortFilters) {
      sortFilterObj[sortFilter.fieldName] = sortFilter.direction;
    }

    return sortFilterObj;
  }
}
