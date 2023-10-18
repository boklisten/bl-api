import "mocha";
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import sinon from "sinon";
import { BlErrorHandler } from "./bl-error-handler";
import { BlDocumentStorage } from "../storage/blDocumentStorage";
import { BlError } from "@boklisten/bl-model";
import { BlErrorLog } from "../collections/bl-error-log/bl-error-log";
import { BlCollectionName } from "../collections/bl-collection";

chai.use(chaiAsPromised);

describe("BlErrorHandler", () => {
  const errorLogStorage = new BlDocumentStorage<BlErrorLog>(
    BlCollectionName.BlErrorLogs,
  );
  const blErrorHandler = new BlErrorHandler(errorLogStorage);

  const errorLogStorageAddSpy = sinon.stub(errorLogStorage, "add");

  afterEach(() => {
    errorLogStorageAddSpy.reset();
  });

  describe("#storeError", () => {
    it("should store error", () => {
      const blError = new BlError("some error");
      const expectedStoredErrorLog = new BlErrorLog(blError);

      errorLogStorageAddSpy.resolves(expectedStoredErrorLog);

      blErrorHandler.storeError(blError);

      return expect(errorLogStorageAddSpy.lastCall.args[0]).to.eql(
        expectedStoredErrorLog,
      );
    });

    it("should store error including error stack", () => {
      const blError = new BlError("some error");
      blError.add(new BlError("another error").code(700));

      const expectedStoredErrorLog = new BlErrorLog(blError);

      errorLogStorageAddSpy.resolves(expectedStoredErrorLog);

      blErrorHandler.storeError(blError);

      const errorLog = errorLogStorageAddSpy.lastCall.args[0];

      return expect(errorLog.errorStack).to.eql(blError.errorStack);
    });

    it("should store error including error store", () => {
      const blError = new BlError("some error");
      blError.store("randomObj", { title: "hi", age: 10 });

      const expectedStoredErrorLog = new BlErrorLog(blError);

      errorLogStorageAddSpy.resolves(expectedStoredErrorLog);

      blErrorHandler.storeError(blError);

      const errorLog = errorLogStorageAddSpy.lastCall.args[0];

      return expect(errorLog.store[0].value.age).to.eql(10);
    });
  });
});
