import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {HttpHandler} from "./http.handler";

chai.use(chaiAsPromised);

describe('HttpHandler', () => {
	const httpHandler = new HttpHandler();
	
	describe('#getWithQuery()', () => {
		/*
		it('should resolve with data', () => {
			
			httpHandler.getWithQuery('https://www.vg.no', '').then((response) => {
				
				console.log('the response', response);
			}).catch(() => {
				console.log('wath the fuck');
			});
		});
		*/
	});
});