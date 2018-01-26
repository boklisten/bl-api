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
			taxRate: 0,
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
			title: 'signatur 3',
			unitPrice: 100,
			taxRate: 0,
			taxAmount: 0,
			rentRate: 0,
			amount: 100,
			type: "rent"
		};
	});
	
	describe('#validateWithOrderItem()', () => {
		
		it('should return true when using valid orderItem and valid item', () => {
			expect(itemValidator.validateItemInOrder(testItem, testOrderItem)).to.be.true;
		});
		
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