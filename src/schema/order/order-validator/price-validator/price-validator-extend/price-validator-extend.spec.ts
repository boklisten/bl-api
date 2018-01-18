import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {BlError, Branch, OrderItem} from "bl-model";
import {PriceValidatorExtend} from "./price-validator-extend";

chai.use(chaiAsPromised);

describe('PriceValidatorExtend', () => {
	const priceValidatorExtend: PriceValidatorExtend = new PriceValidatorExtend();
	let testOrderItem: OrderItem;
	let testBranch: Branch;
	
	beforeEach(() => {
		
		
		testOrderItem = {
			item: 'i1',
			amount: 100,
			type: "extend"
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
	
	describe('#validateOrderItem()', () => {
		beforeEach(() => {
			testOrderItem.type = 'extend';
		});
		
		it('should throw error when orderItem.type is not equal to "extend"', () => {
			testOrderItem.type = 'buy';
			
			expect(() => {
				priceValidatorExtend.validateOrderItem(testOrderItem, testBranch);
			}).to.throw(BlError, /orderItem.type is not equal to extend/);
			
		});
		
		it('should throw error when orderItem.amount is not equal to branch payment values', () => {
			testBranch.payment.extendPrice = 150;
			testOrderItem.amount = 100;
			expect(() => {
				priceValidatorExtend.validateOrderItem(testOrderItem, testBranch);
			}).to.throw(BlError, /orderItem.amount is not correct/);
		});
		
		it('should throw error when orderItem.amount is not equal to branch payment values + orderItem.discount', () => {
			testBranch.payment.extendPrice = 150;
			testOrderItem.amount = 100;
			testOrderItem.discount = -10;
			
			expect(() => {
				priceValidatorExtend.validateOrderItem(testOrderItem, testBranch);
			}).to.throw(BlError, /orderItem.amount is not correct/);
		});
		
		it('should return true if orderItem.amount is equal to branch payment values + orderItem.discount', () => {
			testBranch.payment.extendPrice = 780;
			testOrderItem.amount = 180;
			testOrderItem.discount = -600;
			
			expect(priceValidatorExtend.validateOrderItem(testOrderItem, testBranch))
				.to.be.true;
		});
	});
});