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
			
			it('should throw BlError when customerItem.item is not equal to orderItem.item', (done) => {
				testOrderItems[0].item = 'notEqualItem';
				try {
					customerItemValidator.validateWithOrderItems(testOrderItems, testCustomerItems)
				} catch (err) {
					if (!(err instanceof BlError)) throw new Error('error is not a instance of BlError');
					expect(err.getMsg()).to.contain('orderItem.item is not equal to customerItem.item');
					done();
				}
			});
			
			it('should throw BlError when customerItem.totalAmount is not equal to orderItem.amount', (done) => {
				testOrderItems[0].amount = 299;
				try {
					customerItemValidator.validateWithOrderItems(testOrderItems, testCustomerItems);
				} catch(err) {
					if (!(err instanceof BlError)) throw new Error('error is not a instance of BlError');
					expect(err.getMsg()).to.contain('orderItem.amount is not equal to customerItem.totalAmount');
					done();
				}
			});
			
			it('should throw BlError when customerItem.user is not defined', (done) => {
				testCustomerItems[0].user = null;
				try {
					customerItemValidator.validateWithOrderItems(testOrderItems, testCustomerItems);
				} catch (err) {
					if (!(err instanceof BlError)) throw new Error('error is not an instance of BlError');
					expect(err.getMsg()).to.contain('customerItem.user is undefined');
					done();
				}
			});
			
			it('should throw BlError if customerItem.returned is true', (done) => {
				testCustomerItems[0].returned = true;
				try {
					customerItemValidator.validateWithOrderItems(testOrderItems, testCustomerItems);
				} catch (err) {
					if (!(err instanceof BlError)) throw new Error('error is not an instance of BlError');
					expect(err.getMsg()).to.contain('customerItem.returned is true');
					done();
				}
			});
			
		});
		
		context('when orderItem.type is "buy"', () => {
			it('should throw BlError if orderItem.customerItem is defined', (done) => {
				testOrderItems[0].type = 'buy';
				try {
					customerItemValidator.validateWithOrderItems(testOrderItems, testCustomerItems);
				} catch(err) {
					if (!(err instanceof BlError)) throw new Error('error is not an instance of BlError');
					expect(err.getMsg()).to.contain('orderItem.customerItem is defined');
					done();
				}
			});
		});
		
		context('when orderItem.type is "cancel"', () => {
			context('when orderItem.customerItem is defined', () => {
				it('should throw BlError if customerItem.handoutTime is over the return policy days (two weeks)', (done) => {
					testOrderItems[0].type = 'cancel';
					testCustomerItems[0].handout = true;
					testCustomerItems[0].handoutTime = new Date(1900, 1, 1);
					try {
						customerItemValidator.validateWithOrderItems(testOrderItems, testCustomerItems);
					} catch (err) {
						if (!(err instanceof BlError)) throw new Error('error is not an instance of BlError');
						expect(err.getMsg()).to.contain('customerItem.handoutTime is longer ago than return policy');
						done();
					}
				});
				
				it('should throw BlError if customerItem.returned is true', (done) => {
					testOrderItems[0].type = 'cancel';
					testCustomerItems[0].returned = true;
					testCustomerItems[0].handout = true;
					testCustomerItems[0].handoutTime = new Date();
					try {
						customerItemValidator.validateWithOrderItems(testOrderItems, testCustomerItems);
					} catch (err) {
						if (!(err instanceof BlError)) throw new Error('error is not an instance of BlError');
						expect(err.getMsg()).to.contain('customerItem.returned can not be true');
						done();
					}
				});
				
				it('should throw BlError if orderItem.amount is not the same as customerItem.totalAmount', (done) => {
					testOrderItems[0].type = 'cancel';
					testOrderItems[0].amount = 1000;
					testCustomerItems[0].totalAmount = 200;
					try {
						customerItemValidator.validateWithOrderItems(testOrderItems, testCustomerItems);
					} catch (err) {
						if (!(err instanceof BlError)) throw new Error('error is not an instance of BlError');
						expect(err.getMsg()).to.contain('orderItem.amount is not equal to customerItem.totalAmount');
						done();
					}
				});
			});
		});
		
		
	});
});