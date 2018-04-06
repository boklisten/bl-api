import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {BlError, Order, OrderItem, Item, Branch, CustomerItem} from '@wizardcoder/bl-model';
import {BlDocumentStorage} from "../../../../../../storage/blDocumentStorage";
import {OrderItemExtendValidator} from "./order-item-extend-validator";

chai.use(chaiAsPromised);

describe('OrderItemExtendValidator', () => {
	
	const customerItemStorage = new BlDocumentStorage<CustomerItem>('customeritems');
	const orderItemExtendValidator = new OrderItemExtendValidator(customerItemStorage);
	
	let testOrder: Order;
	let testItem: Item;
	let testBranch: Branch;
	let testCustomerItem: CustomerItem;
	
	describe('validate()', () => {
		
		sinon.stub(customerItemStorage, 'get').callsFake((id: string) => {
			if (id !== testCustomerItem.id) {
				return Promise.reject(new BlError('not found').code(702))
			}
			return Promise.resolve(testCustomerItem);
		});
		
		it('should reject if orderItem.type is not "extend"', () => {
			testOrder.orderItems[0].type = "rent";
			return expect(orderItemExtendValidator.validate(testBranch, testOrder.orderItems[0]))
				.to.be.rejectedWith(BlError, /orderItem.type "rent" is not "extend"/);
		});
		
		it('should reject if orderItem.info.periodType is not allowed at branch', () => {
			testOrder.orderItems[0].info.periodType = "year";
			testBranch.paymentInfo.extendPeriods = [
				{
					type: "semester",
					price: 100,
					maxNumberOfPeriods: 1
				}
			];
			
			return expect(orderItemExtendValidator.validate(testBranch, testOrder.orderItems[0]))
				.to.be.rejectedWith(BlError, /orderItem.info.periodType is "year" but it is not allowed by branch/);
		});
		
		it('should reject if orderItem.info.numberOfPeriods is greater than the maxNumberOfPeriods on branch', () => {
			testOrder.orderItems[0].info.numberOfPeriods = 3;
			testBranch.paymentInfo.extendPeriods = [
				{
					type: "semester",
					price: 100,
					maxNumberOfPeriods: 1
				}
			]
		});
		
		it('should reject if orderItem.info is not defined', () => {
			testOrder.orderItems[0].info = null;
			
			return expect(orderItemExtendValidator.validate(testBranch, testOrder.orderItems[0]))
				.to.be.rejectedWith(BlError, /orderItem.info is not defined/);
		});
		
		it('should reject if orderItem.customerItem is not defined', () => {
			testOrder.orderItems[0].info.customerItem = null;
			
			return expect(orderItemExtendValidator.validate(testBranch, testOrder.orderItems[0]))
				.to.be.rejectedWith(BlError, /orderItem.info.customerItem is not defined/);
		});
		
		it('should reject when customerItem have been extended to many times', () => {
			testCustomerItem.id = 'maxExtendedCustomerItem';
			testBranch.paymentInfo.extendPeriods = [
				{
					type: "semester",
					price: 100,
					maxNumberOfPeriods: 1
				}
			];
			
			testCustomerItem.periodExtends = [
				{
					from: new Date(),
					to: new Date,
					periodType: "semester",
					time: new Date()
				},
				{
					from: new Date(),
					to: new Date(),
					periodType: "semester",
					time: new Date()
				}
			];
			
			testOrder.orderItems[0].info.customerItem = 'maxExtendedCustomerItem';
			
			return expect(orderItemExtendValidator.validate(testBranch, testOrder.orderItems[0]))
				.to.be.rejectedWith(BlError, /orderItem can not be extended any more times/);
			
		});
	});
	
	beforeEach(() => {
		testCustomerItem = {
			id: 'customerItem1',
			item: 'item1',
			deadline: new Date(),
			handout: true,
			handoutInfo: {
				handoutBy: "branch",
				handoutById: 'branch1',
				handoutEmployee: 'employee1',
				time: new Date()
			},
			returned: false,
			periodExtends: [
				{
					from: new Date(),
					to: new Date(),
					periodType: "year",
					time: new Date()
				}
			]
		};
		
		testOrder = {
			id: 'order1',
			amount: 100,
			customer: '',
			orderItems: [
				{
					item: 'item1',
					title: 'Spinn',
					amount: 100,
					unitPrice: 100,
					taxAmount: 0,
					taxRate: 0,
					type: 'extend',
					info: {
						from: new Date(),
						to: new Date(),
						numberOfPeriods: 1,
						periodType: "semester",
						customerItem: 'customerItem1'
					}
				}
			],
			delivery: 'delivery1',
			branch: 'branch1',
			byCustomer: true
		};
		
		testBranch = {
			id: 'branch1',
			name: 'Sonans',
			paymentInfo: {
				responsible: false,
				rentPeriods: [
					{
						type: "semester",
						maxNumberOfPeriods: 2,
						percentage: 0.5
					}
				],
				extendPeriods: [
					{
						type: "semester",
						maxNumberOfPeriods: 1,
						price: 100
					}
				],
				buyout: {
					percentage: 0.50
				},
				acceptedMethods: ['card']
			}
		};
		
		testItem = {
			id: 'item1',
			title: 'Signatur 3',
			type: 'book',
			info: '',
			desc: '',
			price: 600,
			taxRate: 0,
			sell: false,
			sellPrice: 0,
			rent: true,
			buy: true
		}
	});
});