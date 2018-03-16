import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {BlDocumentStorage} from "../../../storage/blDocumentStorage";
import {BlError, Delivery, Item, Order} from "bl-model";
import {deliverySchema} from "../delivery.schema";
import {orderSchema} from "../../order/order.schema";
import {itemSchema} from "../../item/item.schema";
import {DeliveryPostHook} from "./delivery.post.hook";

chai.use(chaiAsPromised);

describe('DeliveryPostHook', () => {
	const deliveryStorage = new BlDocumentStorage<Delivery>('deliveries', deliverySchema);
	const orderStorage = new BlDocumentStorage<Order>('orders', orderSchema);
	const itemStorage = new BlDocumentStorage<Item>('items', itemSchema);
	
	const deliveryPostHook = new DeliveryPostHook(deliveryStorage, orderStorage, itemStorage);
	
	let testDelivery: Delivery;
	let testOrder: Order;
	let testItem: Item;
	
	beforeEach(() => {
		testDelivery = {
			id: 'delivery1',
			method: 'bring',
			amount: 100,
			order: 'order1',
			info: {}
		};
		
		testItem = {
			id: 'item1',
			title: 'signatur 3',
			type: 'book',
			info: {},
			desc: '',
			price: 100,
			taxRate: 0,
			sell: false,
			sellPrice: 0,
			rent: true,
			buy: true
		};
		
		testOrder = {
			id: 'order1',
			customer: 'customer1',
			amount: 100,
			byCustomer: true,
			branch: 'branch1',
			orderItems: [
				{
					item: 'item1',
					title: 'signatur 3',
					amount: 100,
					unitPrice: 100,
					taxAmount: 0,
					taxRate: 0,
					rentRate: 0,
					type: "buy"
				}
			],
			payments: [],
			delivery: ''
		}
	});
	
	
	sinon.stub(deliveryStorage, 'get').callsFake((id: string) => {
		return new Promise((resolve, reject) => {
		    if (id === 'delivery1') {
		    	return resolve(testDelivery);
			}
			return reject(new BlError('not found').code(702));
		});
	});
	
	sinon.stub(orderStorage, 'get').callsFake((id: string) => {
		return new Promise((resolve, reject) => {
		    if (id === 'order1') {
		    	return resolve(testOrder);
			}
			return reject(new BlError('not found').code(702));
		});
	});
	
	sinon.stub(itemStorage, 'getMany').callsFake((ids: string[]) => {
		return new Promise((resolve, reject) => {
		    if (ids[0] === 'item1') {
		    	return resolve(testItem);
			}
			return reject(new BlError('not found').code(702));
		});
	});
	
	describe('#after()', () => {
		it('should reject if deliveryIds is empty or undefined', (done) => {
			deliveryPostHook.after([]).catch((blError) => {
				expect(blError.getMsg())
					.to.contain('deliveryIds is empty or undefined');
				done();
			})
		});
		
		it('should reject if delivery is not found', (done) => {
			deliveryPostHook.after(['notFoundDeliveryId']).catch((blError) => {
				expect(blError.getCode())
					.to.be.eql(702);
				done();
			});
		});
		
		it('should reject if delivery.order is not found', (done) => {
			testDelivery.order = 'notFoundOrder';
			
			deliveryPostHook.after([testDelivery.id]).catch((blError: BlError) => {
				expect(blError.getCode())
					.to.be.eql(702);
				
				expect(blError.getMsg())
					.to.contain(`not found`);
				
				done();
			});
		});
		
		it('should reject if one of the delivery.order.orderitems.item is not found', (done) => {
			testOrder.orderItems[0].item = 'notFoundItem';
			
			deliveryPostHook.after([testDelivery.id]).catch((blError: BlError) => {
				expect(blError.getCode())
					.to.be.eql(702);
				
				done();
			})
		});
	});
});