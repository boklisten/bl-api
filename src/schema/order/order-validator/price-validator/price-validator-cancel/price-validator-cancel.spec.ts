import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {BlError, CustomerItem, Item, OrderItem} from "bl-model";
import {PriceValidatorCancel} from "./price-validator-cancel";

chai.use(chaiAsPromised);

describe('PriceValidatorCancel', () => {

	describe('#validateOrderItem()', () => {
		const priceValidatorCancel: PriceValidatorCancel = new PriceValidatorCancel();
		
		let testOrderItem: OrderItem;
		let testCustomerItem: CustomerItem;
		let testItem: Item;
		
		beforeEach(() => {
			testOrderItem = {
				item: 'i1',
				title: 'signatur',
				unitPrice: 100,
				taxAmount: 0,
				taxRate: 0,
				rentRate: 0,
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
			};
			
			testItem = {
				id: 'i1',
				title: 'Signatur 2',
				type: 'book',
				info: {
					isbn: ''
				},
				categories: [],
				desc: '',
				taxRate: 0,
				price: 100.0,
				sell: true,
				sellPrice: 100,
				rent: true,
				buy: true,
				creationTime: new Date(),
				lastUpdated: new Date(),
				comments: [],
				active: true
			};
		});
		it('should throw error if orderItem.type is not equal to one of the cancel types', () => {
			testOrderItem.type = 'rent';
			
			expect(() => {
				priceValidatorCancel.validateOrderItem(testOrderItem, testCustomerItem, testItem);
			}).to.throw(BlError, /orderItem.type is not in the cancel category/);
		});
	});
});