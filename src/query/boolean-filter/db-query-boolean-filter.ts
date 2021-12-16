export type BooleanFilter = {
  fieldName: string;
  value: boolean;
};

export class DbQueryBooleanFilter {
  constructor() {}

  public getBooleanFilters(
    query: any,
    validBooleanParams: string[]
  ): BooleanFilter[] {
    if (
      !query ||
      (Object.keys(query).length === 0 && query.constructor === Object)
    )
      throw new TypeError("the given query can not be null or undefined");

    return this.generateBooleanFilters(query, validBooleanParams);
  }

  private generateBooleanFilters(
    query: any,
    validBooleanParams: string[]
  ): BooleanFilter[] {
    const booleanFilters: BooleanFilter[] = [];

    for (const param in query) {
      if (validBooleanParams.indexOf(param) > -1) {
        let value = false;
        if (query[param] === "true") {
          value = true;
        } else if (query[param] === "false") {
          value = false;
        } else {
          throw new TypeError(
            'value "' + query[param] + '" could not be parsed to boolean'
          );
        }

        booleanFilters.push({ fieldName: param, value: value });
      }
    }

    return booleanFilters;
  }
}
