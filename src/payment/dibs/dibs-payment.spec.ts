import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {BlError, Order} from "bl-model";
import {DibsPayment} from "./dibs-payment";
import {DibsEasyOrder} from "./dibs-easy-order/dibs-easy-order";

chai.use(chaiAsPromised);

describe('DibsPayment', () => {
	const dibsPayment: DibsPayment = new DibsPayment();
	let testOrder: Order;
	let testDibsEasyOrder: DibsEasyOrder;
	
	beforeEach(() => {
		
		testOrder = {
			id: 'o1',
			amount: 100,
			orderItems: [
				{
					type: "rent",
					title: "Signatur 3",
					amount: 100,
					unitPrice: 200,
					rentRate: 0.5,
					taxRate: 0,
					taxAmount: 0,
					item: 'i1',
					customerItem: 'ci1'
				}
			],
			branch: 'b1',
			byCustomer: true,
			payments: [
				{
					method: "card",
					amount: 100,
					confirmed: true,
					byBranch: false,
					time: new Date()
				}
			],
			comments: [],
			active: false,
			user: {
				id: 'u1'
			},
			lastUpdated: new Date(),
			creationTime: new Date()
		};
		
		testDibsEasyOrder = {
			items: [
				{
					reference: "i1",
					name: "Signatur 3",
					quantity: 1,
					unit: "book",
					unitPrice: 1000,
					taxRate: 0,
					taxAmount: 0,
					grossTotalAmount: 1000,
					netTotalAmount: 1000
				}
			],
			amount: 1000,
			currency: "NOK",
			reference: "o1",
			checkout: {
				url: "",
				ShippingCountries: [
					{countryCode: "NOR"}
				]
			}
		}
	});
	
	describe('orderToDibsEasyOrder', () => {
		
		it('should throw error if order.id is not defined', () => {
			testOrder.id = null;
			
			expect(() => {
				dibsPayment.orderToDibsEasyOrder(testOrder);
			}).to.throw(BlError, /order.id is not defined/);
		});
		
		it('should throw error if order.amount is 0', () => {
			testOrder.amount = 0;
			expect(() => {
				dibsPayment.orderToDibsEasyOrder(testOrder);
			}).to.throw(BlError, /order.amount is zero/);
		});
		
		it('should throw error if order.byCustomer = false', () => {
			testOrder.byCustomer = false;
			expect(() => {
				dibsPayment.orderToDibsEasyOrder(testOrder);
			}).to.throw(BlError, /order.byCustomer is false/);
		});
		
		it('should return a total amount of 10000 when item costs 100kr', () => {
			let deo: DibsEasyOrder = dibsPayment.orderToDibsEasyOrder(testOrder);
			expect(deo.amount).to.eql(10000);
		});
		
		it('should return a dibsEasyOrder.reference equal to "103"', () => {
			testOrder.id = '103';
			let deo: DibsEasyOrder = dibsPayment.orderToDibsEasyOrder(testOrder);
			expect(deo.reference).to.eql('103');
		});
		
		context('dibsEasyOrder.items should be valid', () => {
			it('should have name of "signatur 3"', () => {
				const title = 'signatur 3';
				testOrder.orderItems[0].title = title;
				let deo = dibsPayment.orderToDibsEasyOrder(testOrder);
				
				expect(deo.items[0].name).to.eql(title);
			});
			
			it('should have grossTotalAmount of 15000', () => {
				testOrder.orderItems[0].amount = 150;
				testOrder.amount = 150;
				let deo = dibsPayment.orderToDibsEasyOrder(testOrder);
				
				expect(deo.items[0].grossTotalAmount).to.eql(15000);
			});
			
			it('should have taxAmount equal to 5000', () => {
			
			});
		});
		
		
		
		
		
	});
});