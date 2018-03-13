import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {BlError, Branch, CustomerItem, Item, OrderItem} from "bl-model";
import {PriceValidator} from "./price-validator";

chai.use(chaiAsPromised);

describe('PriceValidator', () => {
	const priceValidator: PriceValidator = new PriceValidator();
	let testItem: Item;
	let testOrderItem: OrderItem;
	let testBranch: Branch;
	let testCustomerItem: CustomerItem;
	
	beforeEach(() => {
		testItem = {
			id: 'i1',
			title: 'Signatur 2',
			type: 'book',
			info: {
				isbn: ''
			},
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
		
		testOrderItem = {
			item: 'i1',
			amount: 100,
			type: "buy",
			title: 'signatur',
			rentRate: 0,
			taxRate: 0,
			taxAmount: 0,
			unitPrice: 100
		};
		
		testBranch = {
			id: 'b1',
			name: 'testBranch',
			type: 'school',
			desc: '',
			root: true,
			childBranches: [''],
			items: [],
			openingHours: [],
			payment: {
				branchResponsible: false,
				rentPricePercentage: {
					base: 0.70,
					oneSemester: 0.5,
					twoSemesters: 0.70,
					buyout: 100
				},
				extendPrice: 100,
				acceptedMethods: []
			},
			comments: [],
			active: true,
			lastUpdated: new Date(),
			creationTime: new Date()
		}
	});
	
	describe('#validatePriceOfCustomerItem()', () => {
		it('should return true when given valid input', () => {
			expect(priceValidator.validateOrderItem(testOrderItem, testItem, testBranch))
				.to.be.true;
		});
		
		
		context('when orderItem.type = buy', () => {
			beforeEach(() => {
					testOrderItem.type = 'buy';
			});
			
			it('should throw error when orderItem.amount is not equal to item.price and no discount is given', () => {
				testOrderItem.amount = 50;
				testItem.price = 100;
				
				expect(() => {
					priceValidator.validateOrderItem(testOrderItem, testItem, testBranch);
				}).to.throw(BlError, /orderItem.amount is not correct/);
			});
			
			it('should return true when orderItem.amount is equal to item.price', () => {
				testOrderItem.amount = 100;
				testItem.price = 100;
				
				expect(priceValidator.validateOrderItem(testOrderItem, testItem, testBranch))
					.to.be.true;
			});
			
			it('should return true when orderItem.amount is equal to item.price - orderItem.discount', () => {
				testOrderItem.amount = 500;
				testOrderItem.discount = -100;
				testItem.price = 600;
				
				expect(priceValidator.validateOrderItem(testOrderItem, testItem, testBranch))
					.to.be.true;
			});
			
			context('when orderItem.amount is not equal to item.price - orderItem.discount', () => {
				
				
				it('should throw error when item.price = 500, orderItem.amount = 100 and discount = 50', () => {
					testItem.price = 500;
					testOrderItem.amount = 100;
					testOrderItem.discount = 50;
					
					expect(() => {
						priceValidator.validateOrderItem(testOrderItem, testItem, testBranch)
					}).to.throw(BlError);
				});
				
				it('should throw error when item.price = 100, orderItem.amount = 66 and discount = 10', () => {
					testItem.price = 100;
					testOrderItem.amount = 66;
					testOrderItem.discount = 10;
					
					expect(() => {
						priceValidator.validateOrderItem(testOrderItem, testItem, testBranch)
					}).to.throw(BlError);
				});
				
				it('should throw error when item.price = 567, orderItem.amount = 500 and discount = 66', () => {
					testItem.price = 567;
					testOrderItem.amount = 500;
					testOrderItem.discount = 66;
					
					expect(() => {
						priceValidator.validateOrderItem(testOrderItem, testItem, testBranch)
					}).to.throw(BlError);
				});
			});
			
			context('when item.price - orderItem.discount is less than 0', () => {
			    it('should return true when item.price = 100, orderItem.discount = -300, orderItem.amount = -200', () => {
					testItem.price = 100;
					testOrderItem.discount = -300;
					testOrderItem.amount = -200;
					
					expect(priceValidator.validateOrderItem(testOrderItem, testItem, testBranch))
						.to.be.true;
				});
			    
			    it('should throw error when item.price = 89.5, orderItem.discount = -50, orderItem.amount = -100', () => {
					testItem.price = 89.5;
					testOrderItem.discount = -50;
					testOrderItem.amount = -100;
					
					expect(() => {
						priceValidator.validateOrderItem(testOrderItem, testItem, testBranch)
					}).to.throw(BlError);
				});
			});
		});
		
		
		context('when orderItem.type = sell', () => {
		    beforeEach(() => {
		    	testOrderItem.type = 'sell';
			});
		    
		    /*
			
			it('should return true when item.sellPrice + orderItem.amount = 0', () => {
				testItem.sellPrice = 187.5;
				testOrderItem.amount = -187.5;
				
				expect(priceValidator.validateOrderItem(testOrderItem, testItem, testBranch))
					.to.be.true;
			});
			
			
			it('should return true when (item.sellPrice + orderItem.discount) + orderItem.amount = 0', () => {
				testItem.sellPrice = 130.8;
				testOrderItem.discount = -20;
				testOrderItem.amount = -110.8;
				
				expect(priceValidator.validateOrderItem(testOrderItem, testItem, testBranch))
					.to.be.true;
			});
			*/
			
			it('should throw error when item.sellPrice - orderItem.amount != 0', () => {
				testItem.price = 45;
				testOrderItem.discount = 0;
				testOrderItem.amount = -44;
				
				expect(() => {
					priceValidator.validateOrderItem(testOrderItem, testItem, testBranch)
				}).to.throw(BlError, /orderItem.amount is not correct/);
			});
		});
		
		context('when orderItem.type = rent', () => {
		    beforeEach(() => {
		    	testOrderItem.type = 'rent';
			});
			
			it('should throw error if orderItem.rentInfo is undefined', () => {
				testOrderItem.rentInfo = null;
				
				expect(() => {
					priceValidator.validateOrderItem(testOrderItem, testItem, testBranch);
				}).to.throw(BlError, /orderItem.rentInfo is not defined/);
			});
			
			it('should throw error if both orderItem.rentInfo.oneSemester and twoSemesters is false or true at the same time', () => {
				testOrderItem.rentInfo = {
					oneSemester: true,
					twoSemesters: true
				};
				
				expect(() => {
					priceValidator.validateOrderItem(testOrderItem, testItem, testBranch);
				}).to.throw(BlError, /oneSemester and twoSemesters can not be equal/);
			});
			
			context('when orderItem.rentInfo.oneSemester is set', () => {
				beforeEach(() => {
					testOrderItem.rentInfo = {oneSemester: true, twoSemesters: false};
				});
				
				
				it('should return true when orderItem.amount is equal to branch payment values * item.price', () => {
					testBranch.payment.rentPricePercentage.oneSemester = 0.50;
					testItem.price = 100;
					testOrderItem.amount = 50;
					testOrderItem.discount = 0;
					
					expect(priceValidator.validateOrderItem(testOrderItem, testItem, testBranch))
						.to.be.true;
				});
				
				it('should throw error when orderItem.amount is not equal to branch payment values * item.price', () => {
					testBranch.payment.rentPricePercentage.oneSemester = 0.50;
					testItem.price = 400;
					testOrderItem.amount = 50;
					testOrderItem.discount = 0;
					
					expect(() => {
						priceValidator.validateOrderItem(testOrderItem, testItem, testBranch)
					}).to.throw(BlError, /orderItem.amount is not correct/);
				});
				
				it('should throw error when orderItem.amount is not equal to branch payment values * item.price + orderItem.discount', () => {
					testBranch.payment.rentPricePercentage.oneSemester = 0.50;
					testItem.price = 100;
					testOrderItem.amount = 50;
					testOrderItem.discount = -3;
					
					expect(() => {
						priceValidator.validateOrderItem(testOrderItem, testItem, testBranch)
					}).to.throw(BlError, /orderItem.amount is not correct/);
				});
			});
			
			context('when orderItem.rentInfo.twoSemester is set', () => {
				beforeEach(() => {
					testOrderItem.rentInfo = {oneSemester: false, twoSemesters: true};
				});
				
				
				it('should return true when orderItem.amount is equal to branch payment values * item.price', () => {
					testBranch.payment.rentPricePercentage.twoSemesters = 0.50;
					testItem.price = 100;
					testOrderItem.amount = 50;
					testOrderItem.discount = 0;
					
					expect(priceValidator.validateOrderItem(testOrderItem, testItem, testBranch))
						.to.be.true;
				});
				
				it('should return true when orderItem.amount is equal to branch payment values * item.price + orderItem.discount', () => {
					testBranch.payment.rentPricePercentage.twoSemesters = 0.50;
					testItem.price = 100;
					testOrderItem.amount = 40;
					testOrderItem.discount = -10;
					
					expect(priceValidator.validateOrderItem(testOrderItem, testItem, testBranch))
						.to.be.true;
				});
				
				it('should throw error when orderItem.amount is not equal to branch payment values * item.price', () => {
					testBranch.payment.rentPricePercentage.twoSemesters = 0.50;
					testItem.price = 400;
					testOrderItem.amount = 50;
					testOrderItem.discount = 0;
					
					expect(() => {
						priceValidator.validateOrderItem(testOrderItem, testItem, testBranch)
					}).to.throw(BlError, /orderItem.amount is not correct/);
				});
				
				it('should throw error when orderItem.amount is not equal to branch payment values * item.price + orderItem.discount', () => {
					testBranch.payment.rentPricePercentage.twoSemesters = 0.50;
					testItem.price = 100;
					testOrderItem.amount = 50;
					testOrderItem.discount = -3;
					
					expect(() => {
						priceValidator.validateOrderItem(testOrderItem, testItem, testBranch)
					}).to.throw(BlError, /orderItem.amount is not correct/);
				});
			});
		});
	});
});