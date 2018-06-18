import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {BlapiResponse, BlError, UserDetail} from '@wizardcoder/bl-model';
import {EmailValidationConfirmOperation} from "./email-validation-confirm.operation";
import {BlDocumentStorage} from "../../../storage/blDocumentStorage";
import {EmailValidation} from "../email-validation";
import {SEResponseHandler} from "../../../response/se.response.handler";
import {Request, Response} from "express";

chai.use(chaiAsPromised);

describe('EmailValidationConfirmOperation', () => {
	const emailValidationStorage = new BlDocumentStorage<EmailValidation>('email_validations');
	const userDetailStorage = new BlDocumentStorage<UserDetail>('user_details');
	const resHandler = new SEResponseHandler();
	const emailValidationConfirmOperation = new EmailValidationConfirmOperation(emailValidationStorage, resHandler, userDetailStorage);

	let testUserDetail: UserDetail = {id: 'userDetail1', emailConfirmed: false} as UserDetail;
	let testEmailValidation: EmailValidation;
	let testUserDetailUpdateSucess: boolean;

	beforeEach(() => {
		testUserDetail.id = 'userDetail1';
		testUserDetail.emailConfirmed = false;

		testEmailValidation = {
			id: 'emailValidation1',
			userDetail: 'userDetail1',
			email: testUserDetail.email
		};

		testUserDetailUpdateSucess = true;
	});

	let resHandlerSendErrorStub = sinon.stub(resHandler, 'sendErrorResponse').callsFake(() => {

	});

	let resHandlerSendResponseStub = sinon.stub(resHandler, 'sendResponse').callsFake(() => {

	});

	sinon.stub(emailValidationStorage, 'get').callsFake((id: string) => {
		if (id !== testEmailValidation.id) {
			return Promise.reject(new BlError('not found'));
		}

		return Promise.resolve(testEmailValidation);
	});

	sinon.stub(userDetailStorage, 'get').callsFake((id: string) => {
		if (id !== testUserDetail.id) {
			return Promise.reject(new BlError('not found'));
		}

		return Promise.resolve(testUserDetail);
	});

	let userDetailStorageUpdateStub = sinon.stub(userDetailStorage, 'update').callsFake((id: string, data: any) => {
		if (id !== testUserDetail.id) {
			return Promise.reject(new BlError('not found'));
		}

		if (!testUserDetailUpdateSucess) {
			return Promise.reject(new BlError('could not update'));
		}

		return Promise.resolve(testUserDetail);
	});

	describe('#run', () => {
		it('should reject if no documentId is provided', (done) => {
			let blApiRequest = {

			};

			emailValidationConfirmOperation.run(blApiRequest).catch((blError: BlError) => {
				expect(blError.getMsg()).to.be.eql(`no documentId provided`);
				expect(resHandlerSendErrorStub.called);
				done();
			});
		});

		it('should reject if emailValidation is not found by id', (done) => {
			let blApiRequest = {
				documentId: 'notFoundEmailValidation'
			};

			emailValidationConfirmOperation.run(blApiRequest).catch((blErr: BlError) => {
				expect(resHandlerSendErrorStub.called);
				expect(blErr.getCode()).to.be.eql(702);
				done();
			});
		});

		it('should reject if userDetail is not found', () => {
			let blApiRequest = {
				documentId: testEmailValidation.id
			};

			testEmailValidation.userDetail = 'notFoundUserDetail';


			expect(emailValidationConfirmOperation.run(blApiRequest))
				.to.be.rejectedWith(BlError, /could not update userDetail/);
		});

		it('should update userDetail with emailConfirmed if all valid inputs are provided', (done) => {
			let blApiRequest = {
				documentId: testEmailValidation.id
			};


			emailValidationConfirmOperation.run(blApiRequest, {} as Request, {} as Response).then(() => {

				expect(userDetailStorageUpdateStub)
					.to.have.been.calledWith(testEmailValidation.userDetail, {emailConfirmed: true});

				expect(resHandlerSendResponseStub)
					.to.have.been.calledWith({}, new BlapiResponse([{confirmed: true}]));

				done();
			});


		});


	});

});