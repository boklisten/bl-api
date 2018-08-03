import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {BlError} from '@wizardcoder/bl-model';
import {EmailValidationHelper} from "../helpers/email-validation.helper";
import {EmailValidationPostHook} from "./email-validation-post.hook";
import {EmailValidation} from "../email-validation";

chai.use(chaiAsPromised);

describe('EmailValidationPostHook', () => {
	const emailValidationHelper = new EmailValidationHelper();
	const emailValidationPostHook = new EmailValidationPostHook(emailValidationHelper);

	let emailValidationHelperSuccess: boolean;

	let testEmailValidation: EmailValidation;

	beforeEach(() => {
		testEmailValidation = {
			id: 'emailValidation1',
			userDetail: 'userDetail1',
			email: 'email@blapi.co'
		}
	});


	sinon.stub(emailValidationHelper, 'sendEmailValidationLink').callsFake(() => {
		if (!emailValidationHelperSuccess) {
			return Promise.reject(new BlError('could not send email validation link'));
		}

		return Promise.resolve(true);
	});


	describe('#after', () => {
		it('should reject if emailValidationHelper.sendEmailValidationLink rejects', (done) => {
			emailValidationHelperSuccess = false;

			emailValidationPostHook.after([testEmailValidation]).catch((blErr: BlError) => {
				expect(blErr.errorStack[0].getMsg())
					.to.be.eql('could not send email validation link');
				done();
			});
		});
	});
});