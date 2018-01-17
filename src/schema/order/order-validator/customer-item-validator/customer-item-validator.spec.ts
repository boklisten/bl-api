import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {BlError, CustomerItem, OrderItem} from "bl-model";
import {CustomerItemValidator} from "./customer-item-validator";

chai.use(chaiAsPromised);

describe('CustomerItemValidator', () => {
	const customerItemValidator: CustomerItemValidator = new CustomerItemValidator();
	
	describe('#validateWithOrderItems()', () => {
		const defaultTotalAmount = 100;
		let testOrderItems: OrderItem[] = [];
		let testCustomerItems: CustomerItem[] = [];
		
		beforeEach(() => {
			testOrderItems = [
				{
					type: "rent",
					amount: defaultTotalAmount,
					item: 'i1',
					customerItem: 'ci1'
				}
			];
			testCustomerItems = [
				{
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
					totalAmount: defaultTotalAmount,
					orderItems: ["oi1"],
					deadlineExtends: []
				}
			];
		});
		
		context('when orderItem.type is "rent"', () => {
			
			it('should throw BlError when customerItem.item is not equal to orderItem.item', () => {
				testOrderItems[0].item = 'notEqualItem';
				try {
					customerItemValidator.validateWithOrderItems(testOrderItems, testCustomerItems)
				} catch (err) {
					if (!(err instanceof BlError)) throw new Error('error is not a instance of BlError');
					expect(err.getMsg()).to.contain('orderItem.item is not equal to customerItem.item');
				}
			});
			
			it('should throw BlError when customerItem.totalAmount is not equal to orderItem.amount', () => {
				testOrderItems[0].amount = 299;
				try {
					customerItemValidator.validateWithOrderItems(testOrderItems, testCustomerItems);
				} catch(err) {
					if (!(err instanceof BlError)) throw new Error('error is not a instance of BlError');
					expect(err.getMsg()).to.contain('orderItem.amount is not equal to customerItem.totalAmount');
				}
			});
		});
		
		
	});
});