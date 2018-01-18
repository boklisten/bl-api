import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {BlError, Branch, Item, OrderItem} from "bl-model";
import {ItemValidator} from "./item-validator";

chai.use(chaiAsPromised);

describe('ItemValidator', () => {
	
	let testItem: Item;
	let testOrderItem: OrderItem;
	let testBranch: Branch;
	const itemValidator: ItemValidator = new ItemValidator();
	
	beforeEach(() => {
		testItem = {
			id: 'i1',
			title: 'Signatur 2',
			type: 'book',
			info: {
				isbn: ''
			},
			desc: '',
			price: 100,
			sell: true,
			sellPrice: 100,
			rent: true,
			buy: true,
			creationTime: new Date(),
			lastUpdated: new Date(),
			comments: [],
			active: true
		};
		
		testOrderItem = {
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
				branchResponsible: true,
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
			active: true,
			lastUpdated: new Date(),
			creationTime: new Date()
		}
	});
	
	describe('#validateWithOrderItem', () => {
		it('should throw BlError when orderItem.item is not the same as item.id', () => {
			testItem.id = 'notarealId';
			testOrderItem.item = 'i4';
			
			expect(() => {
				itemValidator.validateItemInOrder(testItem, testOrderItem);
			}).to.throw(BlError);
		});
		
		it('should throw error when item.actve is false', () => {
			testItem.active = false;
			
			expect(() => {
				itemValidator.validateItemInOrder(testItem, testOrderItem);
			}).to.throw(BlError, /item.active is false/);
		});
		
		context('when orderItem.type = rent', () => {
			
			it('should throw error if item.rent is false', () => {
				testItem.rent = false;
				testOrderItem.type = 'rent';
				
				expect(() => {
					itemValidator.validateItemInOrder(testItem, testOrderItem)
				}).to.throw(BlError, /item.rent is false/)
			});
		});
		
		context('when orderItem.type = sell', () => {
			it('should throw error if item.sell is false', () => {
				testItem.sell = false;
				testOrderItem.type = 'sell';
				
				expect(() => {
					itemValidator.validateItemInOrder(testItem, testOrderItem)
				}).to.throw(BlError, /item.sell is false/);
			});
		});
	});
});