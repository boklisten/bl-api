import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {BlError, CustomerItem, OrderItem} from "bl-model";
import {PriceValidatorCancel} from "./price-validator-cancel";

chai.use(chaiAsPromised);

describe('PriceValidatorCancel', () => {

	describe('#validateOrderItem()', () => {
		const priceValidatorCancel: PriceValidatorCancel = new PriceValidatorCancel();
		
		let testOrderItem: OrderItem;
		let testCustomerItem: CustomerItem;
		
		beforeEach(() => {
			testOrderItem = {
				item: 'i1',
				amount: 100,
				type: "cancel-rent"
			};
			
			testCustomerItem = {
				id: 'ci1',
				creationTime: new Date(),
				lastUpdated: new Date(),
				comments: [],
				active: true,
				user: {
					id: 'u1'
				},
				item: 'i1',
				deadline: new Date(),
				status: '',
				handout: true,
				handoutTime: new Date(),
				handoutBranch: '',
				handoutEmployee: '',
				returned: false,
				returnTime: new Date(),
				returnBranch: '',
				returnEmployee: '',
				totalAmount: 100,
				orderItems: ["oi1"],
				deadlineExtends: []
			}
		});
		it('should throw error if orderItem.type is not equal to one of the cancel types', () => {
			testOrderItem.type = 'rent';
			
			expect(() => {
				priceValidatorCancel.validateOrderItem(testOrderItem, testCustomerItem);
			}).to.throw(BlError, /orderItem.type is not in the cancel category/);
		});
	});
});