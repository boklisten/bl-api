import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
import {BlDocumentStorage} from "../../../storage/blDocumentStorage";
import {Payment} from 'bl-model';
import {PaymentPostHook} from "./payment.post.hook";

chai.use(chaiAsPromised);

describe('PaymentPostHook', () => {
	const paymentStorage: BlDocumentStorage<Payment> = new BlDocumentStorage('payments');
	const paymentPostHook = new PaymentPostHook();
	
	describe('#before()', () => {
	
	});
	
	describe('#after()', () => {
	
	});
});