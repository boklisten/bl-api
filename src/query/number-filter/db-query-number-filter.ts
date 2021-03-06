export type NumberFilter = {
  fieldName: string;
  op: {
    $lt?: number;
    $gt?: number;
    $eq?: number;
  };
};

export class DbQueryNumberFilter {
  private operationIdentifiers = [
    { op: "$gt", opIdentifier: ">", atIndex: 0 },
    { op: "$lt", opIdentifier: "<", atIndex: 0 },
  ];

  private equalOperation = "$eq";

  constructor() {}

  public getNumberFilters(
    query: any,
    validNumberParams: string[]
  ): NumberFilter[] {
    let numberFilters: NumberFilter[] = [];

    if (
      !query ||
      (Object.keys(query).length === 0 && query.constructor === Object)
    )
      throw new TypeError("the given query can not be null or undefined");
    if (validNumberParams.length <= 0) return [];

    try {
      for (let param in query) {
        if (validNumberParams.indexOf(param) > -1) {
          let numberFilter: NumberFilter;

          if (Array.isArray(query[param])) {
            numberFilter = this.generateNumberFilterForParamWithMultipleValues(
              param,
              query[param]
            );
          } else {
            numberFilter = this.generateNumberFilterForParamWithSingleValue(
              param,
              query[param]
            );
          }

          numberFilters.push(numberFilter);
        }
      }

      return numberFilters;
    } catch (error) {
      if (error instanceof TypeError)
        throw new TypeError(
          "query includes bad number data, reason: " + error.message
        );
      if (error instanceof SyntaxError)
        throw new SyntaxError(
          "query includes syntax errors, reason: " + error.message
        );
      throw new Error(
        "failure when parsing query for number operations" + error.message
      );
    }
  }

  private generateNumberFilterForParamWithSingleValue(
    fieldName: string,
    value: string
  ): NumberFilter {
    if (!value)
      throw new Error(
        "QueryBuilderNumberFilter.generateNumberFilter(): value is not defined"
      );

    if (this.valueHasOperationIdentifier(value)) {
      let opWithValue = this.getOperationWithValue(value);
      let op: any = {};

      op[opWithValue.operation] = opWithValue.value;

      return { fieldName: fieldName, op };
    }

    return this.validateNumberFilter({
      fieldName: fieldName,
      op: { $eq: this.extractNumberFromQueryString(value) },
    });
  }

  private generateNumberFilterForParamWithMultipleValues(
    fieldName: string,
    values: string[]
  ): NumberFilter {
    if (values.length <= 0) throw new RangeError("the supplied array is empty");

    let op: any = {};

    for (let value of values) {
      let opWithValue = this.getOperationWithValue(value);
      op[opWithValue.operation] = opWithValue.value;
    }

    return this.validateNumberFilter({ fieldName: fieldName, op: op });
  }

  private validateNumberFilter(numberFilter: NumberFilter) {
    if (numberFilter.op.$eq) {
      if (numberFilter.op.$gt || numberFilter.op.$lt)
        throw new SyntaxError(
          "numberFilter cannot combine eq operation with other operations"
        );
    }

    return numberFilter;
  }

  private valueHasOperationIdentifier(value: string): boolean {
    for (let operationIdentifiers of this.operationIdentifiers) {
      if (value.length >= operationIdentifiers.atIndex) {
        if (
          operationIdentifiers.opIdentifier ===
          value[operationIdentifiers.atIndex]
        )
          return true;
      }
    }
    return false;
  }

  private getOperationWithValue(value: string): {
    operation: string;
    value: number;
  } {
    let operation = this.getOperation(value);
    let number;

    if (operation === this.equalOperation) {
      number = this.extractNumberFromQueryString(value);
    } else {
      number = this.extractNumberFromQueryString(value.substr(1, value.length));
    }

    return {
      operation: operation,
      value: number,
    };
  }

  private getOperation(value: string): string {
    for (let operationIdentifier of this.operationIdentifiers) {
      if (value.length >= operationIdentifier.atIndex) {
        if (
          operationIdentifier.opIdentifier ===
          value[operationIdentifier.atIndex]
        ) {
          return operationIdentifier.op;
        }
      }
    }

    return this.equalOperation;
  }

  private extractNumberFromQueryString(num: string): number {
    for (let n of num) {
      if (isNaN(parseInt(n, 10)))
        throw TypeError('value "' + num + '" is not a valid number');
    }
    return parseInt(num, 10);
  }
}
