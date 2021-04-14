// @ts-nocheck
import "mocha";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { expect } from "chai";
import sinon from "sinon";
import { BlapiResponse, BlError, UserDetail } from "@boklisten/bl-model";
import { UserDetailValidOperation } from "./user-detail-valid.operation";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { SEResponseHandler } from "../../../response/se.response.handler";
import { Response } from "express";
import { BlApiRequest } from "../../../request/bl-api-request";

chai.use(chaiAsPromised);

describe("UserDetailValidOperation", () => {
  const userDetailStorage = new BlDocumentStorage<UserDetail>("user_details");
  const responseHandler = new SEResponseHandler();
  const userDetailValidOperation = new UserDetailValidOperation(
    userDetailStorage,
    responseHandler
  );

  let testUserDetail: UserDetail;

  describe("#run", () => {
    sinon.stub(userDetailStorage, "get").callsFake((id: string) => {
      if (id !== testUserDetail.id) {
        return Promise.reject(new BlError(`userDetail "${id}" not found`));
      }

      return Promise.resolve(testUserDetail);
    });

    let resHandlerSendResponseStub = sinon
      .stub(responseHandler, "sendResponse")
      .callsFake((res: any, blApiResponse: BlapiResponse) => {});

    let resHandlerSendErrorResponseStub = sinon
      .stub(responseHandler, "sendErrorResponse")
      .callsFake((res: any, blError: BlError) => {});

    it("should reject if userDetail is not found", (done) => {
      testUserDetail = {
        id: "userDetail1",
      } as UserDetail;

      let blApiRequest = {
        documentId: "notFoundUserDetail",
      };

      userDetailValidOperation
        .run(blApiRequest, null, null)
        .catch((blError: BlError) => {
          expect(resHandlerSendErrorResponseStub).to.have.been.called;

          expect(blError.getMsg()).to.be.eql(
            "userDetail could not be validated"
          );

          expect(blError.errorStack[0].getMsg()).to.be.eql(
            `userDetail "notFoundUserDetail" not found`
          );
          done();
        });
    });

    context("when user detail is valid", () => {
      beforeEach(() => {
        testUserDetail = {
          id: "userDetail1",
          name: "Freddy Mercury",
          email: "freddy@blapi.co",
          phone: "12345678",
          address: "Star road 1",
          postCode: "0123",
          postCity: "LONDON",
          country: "ENGLAND",
          dob: new Date(1946, 9, 5),
          branch: "branch1",
          emailConfirmed: true,
        };
      });

      it("should send response with {valid: true}", (done) => {
        let blApiRequest = {
          documentId: "userDetail1",
        };

        userDetailValidOperation.run(blApiRequest, null, null).then(() => {
          expect(resHandlerSendResponseStub).to.have.been.calledWith(
            null,
            new BlapiResponse([{ valid: true }])
          );

          done();
        });
      });
    });

    context("when user detail is not valid", () => {
      beforeEach(() => {
        testUserDetail = {
          id: "userDetail1",
          name: "Freddy Mercury",
          email: "freddy@blapi.co",
          phone: "12345678",
          address: "Star road 1",
          postCode: "0123",
          postCity: "LONDON",
          country: "ENGLAND",
          dob: new Date(1946, 9, 5),
          branch: "branch1",
          emailConfirmed: true,
        };
      });

      it("should resolve with valid false if name is not defined", (done) => {
        testUserDetail.name = "";
        let blApiRequest: BlApiRequest = {
          documentId: "userDetail1",
        };

        userDetailValidOperation.run(blApiRequest, null, null).then(() => {
          expect(resHandlerSendResponseStub).to.have.been.calledWith(
            null,
            new BlapiResponse([{ valid: false, invalidFields: ["name"] }])
          );
          done();
        });
      });

      it("should resolve with valid false if address and postCode is not defined", (done) => {
        testUserDetail.address = "";
        testUserDetail.postCode = null;
        let blApiRequest: BlApiRequest = {
          documentId: "userDetail1",
        };

        userDetailValidOperation.run(blApiRequest, null, null).then(() => {
          expect(resHandlerSendResponseStub).to.have.been.calledWith(
            null,
            new BlapiResponse([
              { valid: false, invalidFields: ["address", "postCode"] },
            ])
          );
          done();
        });
      });

      it("should resolve with valid false if postCity and phone is not defined", (done) => {
        testUserDetail.postCity = "";
        testUserDetail.phone = undefined;
        let blApiRequest: BlApiRequest = {
          documentId: "userDetail1",
        };

        userDetailValidOperation.run(blApiRequest, null, null).then(() => {
          expect(resHandlerSendResponseStub).to.have.been.calledWith(
            null,
            new BlapiResponse([
              { valid: false, invalidFields: ["postCity", "phone"] },
            ])
          );
          done();
        });
      });
      /*
			it('should resolve with valid false if emailConfirmed is not true', (done) => {
				testUserDetail.emailConfirmed = false;
				let blApiRequest: BlApiRequest = {
					documentId: 'userDetail1'
				};

				userDetailValidOperation.run(blApiRequest, null, null).then(() => {
					expect(resHandlerSendResponseStub)
						.to.have.been
						.calledWith(null, new BlapiResponse([{valid: false, invalidFields: ['emailConfirmed']}]));
					done();
				})
			});
      */

      it("should resolve with valid false if dob is not defined", (done) => {
        testUserDetail.dob = undefined;
        let blApiRequest: BlApiRequest = {
          documentId: "userDetail1",
        };

        userDetailValidOperation.run(blApiRequest, null, null).then(() => {
          expect(resHandlerSendResponseStub).to.have.been.calledWith(
            null,
            new BlapiResponse([{ valid: false, invalidFields: ["dob"] }])
          );
          done();
        });
      });
    });
  });
});
