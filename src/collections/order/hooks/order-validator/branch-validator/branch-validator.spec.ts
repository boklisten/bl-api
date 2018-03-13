import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {BlError, Branch, Item, OrderItem} from "bl-model";
import {BranchValidator} from "./branch-validator";

chai.use(chaiAsPromised);

describe('BranchValidator', () => {
	let testOrderItem: OrderItem;
	let testBranch: Branch;
	const branchValidator: BranchValidator = new BranchValidator();
	
	beforeEach(() => {
		testOrderItem = {
			title: "signatur 3",
			unitPrice: 200,
			rentRate: 0,
			taxRate: 0,
			taxAmount: 0,
			item: 'i1',
			amount: 100,
			type: "rent"
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
					base: 1.1,
					oneSemester: 1.1,
					twoSemesters: 1.2,
					buyout: 100
				},
				extendPrice: 100,
				acceptedMethods: []
			},
			comments: [],
			itemCategories: [],
			active: true,
			lastUpdated: new Date(),
			creationTime: new Date()
		}
	});
	
	describe('#validateBranchInOrder()', () => {
		
		it('should throw error if branch.active = false', () => {
			testBranch.active = false;
			
			expect(() => {
				branchValidator.validateBranchInOrderItem(testBranch, testOrderItem);
			}).to.throw(BlError, /branch.active is false/);
			
		});
		
		it('should return true when using valid orderItem and valid branch', () => {
			expect(branchValidator.validateBranchInOrderItem(testBranch, testOrderItem))
				.to.be.true;
		});
		
		context('when orderItem.type = rent', () => {
			it('should throw error if branch.payment.branchResponsible is true but orderItem.amount is over 0', () => {
				testBranch.payment.branchResponsible = true;
				testOrderItem.amount = 300;
				testOrderItem.type = 'rent';
				
				expect(() => {
					branchValidator.validateBranchInOrderItem(testBranch, testOrderItem);
				}).to.throw(BlError, /amount is over 0 when branch.payment.branchResponsible is true/);
			});
		});
	});
});