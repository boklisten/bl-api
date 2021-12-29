// AUTO IGNORED:
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
import { HttpHandler } from "./http.handler";

chai.use(chaiAsPromised);

describe("HttpHandler", () => {
  const httpHandler = new HttpHandler();

  // AUTO IGNORED:
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  describe("#getWithQuery()", () => {});
});
