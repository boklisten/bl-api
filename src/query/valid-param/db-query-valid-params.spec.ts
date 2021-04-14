// @ts-nocheck
import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
import { DbQueryValidParams, ValidParam } from "./db-query-valid-params";

chai.use(chaiAsPromised);

describe("DbQueryValidParams", () => {
  describe("getValidNumberParams()", () => {
    it("should return empty array if no valid NumberParams is set", () => {
      let dbQueryValidParams: DbQueryValidParams = new DbQueryValidParams([]);
      expect(dbQueryValidParams.getValidNumberParams()).to.eql([]);
    });

    it('should return array like ["name", "desc"] ', () => {
      let validParams: ValidParam[] = [];
      validParams.push({ fieldName: "age", type: "number" });
      validParams.push({ fieldName: "price", type: "number" });
      let dbQueryValidParams: DbQueryValidParams = new DbQueryValidParams(
        validParams
      );
      let result = ["age", "price"];

      expect(dbQueryValidParams.getValidNumberParams()).to.eql(result);
    });

    it("should return empty array if none of the validParams are of type number", () => {
      let validParams: ValidParam[] = [{ fieldName: "name", type: "string" }];
      let dbQueryValidParams: DbQueryValidParams = new DbQueryValidParams(
        validParams
      );
      expect(dbQueryValidParams.getValidNumberParams()).to.eql([]);
    });
  });

  describe("getValidStringParams()", () => {
    it("should return string array with names of all validParams with type string", () => {
      let validParams: ValidParam[] = [
        { fieldName: "name", type: "string" },
        { fieldName: "desc", type: "string" },
      ];
      let dbQuertyValidParams: DbQueryValidParams = new DbQueryValidParams(
        validParams
      );
      let result = ["name", "desc"];

      expect(dbQuertyValidParams.getValidStringParams()).to.eql(result);
    });

    it('should return empty array if no validParams with type "string" is given', () => {
      let validParams: ValidParam[] = [{ fieldName: "age", type: "number" }];

      let dbQueryValidParams: DbQueryValidParams = new DbQueryValidParams(
        validParams
      );

      expect(dbQueryValidParams.getValidStringParams()).to.eql([]);
    });
  });
});
