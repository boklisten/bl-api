import { Types } from "mongoose";

export type ObjectIdFilter = {
  fieldName: string;
  value: Types.ObjectId | string | any[];
};

export class DbQueryObjectIdFilter {
  constructor() {}

  getObjectIdFilters(
    query: any,
    validStringParams: string[]
  ): ObjectIdFilter[] {
    if (
      !query ||
      (Object.keys(query).length === 0 && query.constructor === Object)
    ) {
      throw new TypeError("query can not be undefined or empty");
    }
    if (validStringParams.length <= 0) return [];

    const objectIdFilters: ObjectIdFilter[] = [];

    try {
      for (const param in query) {
        if (validStringParams.indexOf(param) > -1) {
          if (Array.isArray(query[param])) {
            const valueArr = [];
            query[param].forEach((paramValue) => {
              valueArr.push(this.getStringParamValue(paramValue));
              valueArr.push(this.getObjectIdParamValue(paramValue));
            });
            objectIdFilters.push({
              fieldName: param,
              value: valueArr,
            });
          } else {
            const valueArr = [
              this.getStringParamValue(query[param]),
              this.getObjectIdParamValue(query[param]),
            ];
            objectIdFilters.push({
              fieldName: param,
              value: valueArr,
            });
          }
        }
      }

      return objectIdFilters;
    } catch (error) {
      if (error instanceof TypeError) {
        throw new TypeError(
          "query includes bad object-id parameter data, reason: " +
            error.message
        );
      }

      throw new Error(
        "could not parse the object-id parameters in query, reason: " +
          error.message
      );
    }
  }

  private getObjectIdParamValue(param: string): Types.ObjectId {
    if (this.validateStringParam(param)) {
      return new Types.ObjectId(param);
    }
    throw new TypeError(
      'the paramterer of value "' + param + '" is not a valid string'
    );
  }

  private getStringParamValue(param: string): string {
    if (this.validateStringParam(param)) {
      return param;
    }
    throw new TypeError(
      'the paramterer of value "' + param + '" is not a valid string'
    );
  }

  private validateStringParam(param: string): boolean {
    if (!param) return false;
    if (new Types.ObjectId(param).toString() !== param) return false;
    if (!(typeof param === "string")) return false;
    if (param.length <= 0) return false;
    return true;
  }
}
