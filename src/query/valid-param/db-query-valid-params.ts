export type ValidParam = {
  fieldName: string;
  type: "string" | "number" | "boolean" | "date" | "expand" | "object-id";
};

export class DbQueryValidParams {
  private validParams: ValidParam[];

  constructor(validParams: ValidParam[]) {
    this.validParams = validParams;
  }

  public getValidNumberParams(): string[] {
    return this.getValidParamsBasedOnType("number");
  }

  public getValidStringParams(): string[] {
    return this.getValidParamsBasedOnType("string");
  }

  public getValidObjectIdParams(): string[] {
    return this.getValidParamsBasedOnType("object-id");
  }

  public getValidBooleanParams(): string[] {
    return this.getValidParamsBasedOnType("boolean");
  }

  public getValidDateParams(): string[] {
    return this.getValidParamsBasedOnType("date");
  }

  public getValidExpandParams(): string[] {
    return this.getValidParamsBasedOnType("expand");
  }

  public getAllValidParams(): string[] {
    let allValidParams: string[] = [];

    for (let validParam of this.validParams) {
      allValidParams.push(validParam.fieldName);
    }

    return allValidParams;
  }

  private getValidParamsBasedOnType(type: string) {
    let validParamsBasedOnType: string[] = [];

    for (let validParam of this.validParams) {
      if (validParam.type === type) {
        validParamsBasedOnType.push(validParam.fieldName);
      }
    }

    return validParamsBasedOnType;
  }
}
