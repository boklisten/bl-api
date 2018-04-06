import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {BlError, Delivery, Order} from '@wizardcoder/bl-model';
import {DeliveryBringHandler} from "./delivery-bring-handler";

chai.use(chaiAsPromised);

describe('DeliveryBringHandler', () => {
	let testDelivery: Delivery;
	let testOrder: Order;
	const deliveryBringHandler = new DeliveryBringHandler();
	
	beforeEach(() => {
		testOrder = {
			id: 'order1',
			amount: 300,
			orderItems: [],
			customer: 'customer1',
			branch: 'branch1',
			byCustomer: true
		};
		
		testDelivery = {
			id: 'delivery1',
			method: "bring",
			info: {
				amount: 100,
				estimatedDelivery: new Date(),
				taxAmount: 0,
				from: '7070',
				to: '0560'
			},
			order: "order1",
			amount: 100
		}
	});
	
	describe('validate()', () => {
		it('should reject with error if delivery.info is not defined', () => {
			testDelivery.info = undefined;
			
			return expect(deliveryBringHandler.validate(testDelivery, testOrder))
				.to.be.rejectedWith(BlError, /delivery.info not defined/);
		});
		
		it('should reject if delivery.info.from is empty or undefined', () => {
			testDelivery.info = {
				amount: 100,
				estimatedDelivery: new Date(),
				taxAmount: 0,
				from: undefined,
				to: '0560'
			};
			
			return expect(deliveryBringHandler.validate(testDelivery, testOrder))
				.to.be.rejectedWith(BlError, /delivery.info.from not defined/);
		});
		
		it('should reject if delivery.info.from is empty or undefined', () => {
			testDelivery.info = {
				amount: 100,
				estimatedDelivery: new Date(),
				taxAmount: 0,
				from: '7070',
				to: undefined
			};
			
			return expect(deliveryBringHandler.validate(testDelivery, testOrder))
				.to.be.rejectedWith(BlError, /delivery.info.to not defined/);
			
		});
	});
});