import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {BlError} from '@wizardcoder/bl-model';
import {ApiPath} from "./api-path";

chai.use(chaiAsPromised);

describe('ApiPath', () => {
	const apiPath = new ApiPath();

	describe('#retrieveRefererPath', () => {
		it('should return null if path does not include our basePath', () => {
			return expect(apiPath.retrieveRefererPath({referer: 'https://www.m.facebook.com'}))
				.to.be.eq(null);
		});

		it('should return null if path does not include our basePath', () => {
			return expect(apiPath.retrieveRefererPath({refferer: 'https://google.com'}))
				.to.be.eq(null);
		});

		it('should return refererPath if url includes our basePath', () => {
			return expect(apiPath.retrieveRefererPath({referer: 'https://www.boklisten.no/auth/login'}))
				.to.be.eq('https://www.boklisten.no/');
		});

		it('should return refererPath if url includes our basePath', () => {
			return expect(apiPath.retrieveRefererPath({referer: 'https://bladmin.boklisten.no/auth/login'}))
				.to.be.eq('https://bladmin.boklisten.no/');
		});

		it('should return refererPath if url includes our basePath', () => {
			return expect(apiPath.retrieveRefererPath({referer: 'https://api.boklisten.no/auth/login'}))
				.to.be.eq('https://api.boklisten.no/');
		});
	});
});