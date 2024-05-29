import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
import { MongooseModelCreator } from "./mongoose-schema-creator";
import { ObjectId } from "mongodb";

chai.use(chaiAsPromised);

describe("MongooseModelCreator", () => {
  describe("transformObject", () => {
    it("should convert objectIDs in objects to strings", () => {
      const input = {
        _id: new ObjectId(),
        user: new ObjectId(),
        items: [new ObjectId(), new ObjectId()],
      };
      const expectedOutput = {
        id: input._id.toString(),
        user: input.user.toString(),
        items: input.items.map((item) => item.toString()),
      };
      MongooseModelCreator.transformObject(input, undefined);
      expect(input).to.deep.eq(expectedOutput);
    });

    it("should convert objectIDs in an array to strings", () => {
      const input = [new ObjectId(), new ObjectId()];
      const expectedOutput = input.map((item) => item.toString());
      MongooseModelCreator.transformObject(input, undefined);
      expect(input).to.deep.eq(expectedOutput);
    });
  });
});
