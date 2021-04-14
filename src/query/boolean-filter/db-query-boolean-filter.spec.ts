// @ts-nocheck
import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
import { DbQueryBooleanFilter } from "./db-query-boolean-filter";

chai.use(chaiAsPromised);

describe("DbQueryBooleanFilter", () => {
  describe("getBooleanFilters", () => {
    let dbQueryBooleanFilter: DbQueryBooleanFilter = new DbQueryBooleanFilter();

    it("should throw TypeError if query is empty or null", () => {
      expect(() => {
        dbQueryBooleanFilter.getBooleanFilters(null, ["hello"]);
      }).to.throw(TypeError);
    });

    it("should return empty filter if ValidBoomeanParams array is empty", () => {
      expect(
        dbQueryBooleanFilter.getBooleanFilters({ name: "albert" }, [])
      ).to.eql([]);
    });

    it('should return array of [{fieldName: "haveEaten", value: true"}]', () => {
      let result = [{ fieldName: "haveEaten", value: true }];
      expect(
        dbQueryBooleanFilter.getBooleanFilters({ haveEaten: "true" }, [
          "haveEaten",
        ])
      ).to.eql(result);
    });

    it("should throw TypeError if a value that is can not be parsed to boolean is given", () => {
      expect(() => {
        dbQueryBooleanFilter.getBooleanFilters({ haveEaten: "hello" }, [
          "haveEaten",
        ]);
      }).to.throw(TypeError);
    });

    it("should return array that includes all params that are of boolean type in query", () => {
      let result = [
        { fieldName: "confirmed", value: true },
        { fieldName: "hasCar", value: false },
        { fieldName: "isOld", value: true },
      ];

      expect(
        dbQueryBooleanFilter.getBooleanFilters(
          { confirmed: "true", hasCar: "false", isOld: "true" },
          ["confirmed", "hasCar", "isOld", "haveChildren"]
        )
      ).to.eql(result);
    });
  });
});
