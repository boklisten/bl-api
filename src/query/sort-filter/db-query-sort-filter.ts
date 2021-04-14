export type SortFilter = {
  fieldName: string;
  direction: 1 | -1;
};
export class DbQuerySortFilter {
  constructor() {}

  public getSortFilters(query: any, validSortParams: string[]): SortFilter[] {
    if (
      !query ||
      (Object.keys(query).length === 0 && query.constructor === Object)
    ) {
      throw new TypeError("query can not be undefined or empty");
    }

    if (!query.sort) return [];

    return this.generateSortFilters(query.sort, validSortParams);
  }

  private generateSortFilters(
    sort: any,
    validSortParams: string[]
  ): SortFilter[] {
    let sortFilters: SortFilter[] = [];
    let sortArray = [];
    if (!Array.isArray(sort)) {
      if (typeof sort !== "string")
        throw new TypeError(
          'sort of value "' + sort + '" is not of type Array[string] or string'
        );
      sortArray.push(sort);
    } else {
      sortArray = sort;
    }

    for (let sortValue of sortArray) {
      if (this.validSortValue(sortValue, validSortParams)) {
        sortFilters.push(this.getSortFilter(sortValue));
      }
    }

    return sortFilters;
  }

  private getSortFilter(sortValue: string): SortFilter {
    return {
      fieldName: this.getBaseSortParam(sortValue),
      direction: this.getDirection(sortValue),
    };
  }

  private validSortValue(
    sortValue: string,
    validSortParams: string[]
  ): boolean {
    let sval = this.getBaseSortParam(sortValue);

    if (validSortParams.indexOf(sval) <= -1)
      throw ReferenceError(
        'sort parameter "' + sval + '" is not in validSortParams'
      );

    return true;
  }

  private getBaseSortParam(sortValue: string) {
    if (sortValue[0] === "-") {
      return sortValue.substr(1, sortValue.length);
    }
    return sortValue;
  }

  private getDirection(sortValue: string): 1 | -1 {
    if (sortValue[0] === "-") return -1;
    return 1;
  }
}
