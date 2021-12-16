export type OnlyGetFilter = {
  fieldName: string;
  value: number;
};

export class DbQueryOnlyGetFilter {
  constructor() {}

  public getOnlyGetFilters(
    query: any,
    validOnlyGetParams: string[]
  ): OnlyGetFilter[] {
    if (
      !query ||
      (Object.keys(query).length === 0 && query.constructor === Object)
    ) {
      throw new TypeError("query can not be undefined or empty");
    }

    if (!query.og) return [];
    if (validOnlyGetParams.length <= 0) return [];

    return this.generateOnlyGetFilters(query.og, validOnlyGetParams);
  }

  private generateOnlyGetFilters(
    og: any,
    validOnlyGetParams: string[]
  ): OnlyGetFilter[] {
    let onlyGetParamArray = [];

    if (!Array.isArray(og)) {
      onlyGetParamArray.push(og);
    } else {
      onlyGetParamArray = og;
    }

    const onlyGetFilters: OnlyGetFilter[] = [];

    for (const onlyGetParam of onlyGetParamArray) {
      if (validOnlyGetParams.indexOf(onlyGetParam) <= -1)
        throw ReferenceError(
          'the parameter "' + onlyGetParam + '" is not in validOnlyGetParams'
        );
      onlyGetFilters.push({ fieldName: onlyGetParam, value: 1 });
    }

    return onlyGetFilters;
  }
}
