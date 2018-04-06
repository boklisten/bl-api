import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {BlError, Order, OrderItem, CustomerItem} from '@wizardcoder/bl-model';
import {BlDocumentStorage} from "../../../../storage/blDocumentStorage";
import {OrderPlacedHandler} from "./order-placed-handler";

chai.use(chaiAsPromised);

describe('OrderPlacedHandler', () => {
	let testOrder: Order;
	let testCustomerItem: CustomerItem;
	const customerItemStorage = new BlDocumentStorage<CustomerItem>('customeritems');
	const orderStorage = new BlDocumentStorage<Order>('orders');
	const orderPlacedHandler = new OrderPlacedHandler(customerItemStorage, orderStorage);
	
	sinon.stub(customerItemStorage, 'add').callsFake((customerItem: CustomerItem) => {
		if (customerItem.item === 'item1') {
			customerItem.id = 'customerItem1';
			return Promise.resolve(customerItem);
		} else if (customerItem.item === 'item2') {
			customerItem.id = 'customerItem2';
			return Promise.resolve(customerItem)
		} else {
			return Promise.reject('could not add doc');
		}
	});
	
	sinon.stub(orderStorage, 'update').callsFake((id: string, data: any) => {
		if (id !== testOrder.id) {
			return Promise.reject(new BlError('could not update'))
		}
		return Promise.resolve(testOrder);
	});
	
	beforeEach(() => {
		testCustomerItem = {
			id: 'customerItem1',
			item: 'item1',
			deadline: new Date(),
			handout: false,
			returned: false
		};
		
		testOrder = {
			id: 'branch1',
			amount: 100,
			orderItems: [
				{
					type: "rent",
					item: 'item1',
					title: 'Signatur 3',
					amount: 50,
					unitPrice: 100,
					taxRate: 0.5,
					taxAmount: 25,
					info: {
						from: new Date(),
						to: new Date(),
						numberOfPeriods: 1,
						periodType: "semester"
					}
				},
				{
					type: "rent",
					item: 'item2',
					title: 'Signatur 3: Tekstsammling',
					amount: 50,
					unitPrice: 100,
					taxRate: 0.5,
					taxAmount: 25,
					info: {
						from: new Date(),
						to: new Date(),
						numberOfPeriods: 1,
						periodType: "semester"
					}
				}
			],
			branch: 'branch1',
			customer: 'customer1',
			byCustomer: true,
			placed: true,
			payments: [],
			delivery: 'delivery1'
		}
	});
	
	describe('createCustomerItems()', () => {
		it('should resolve with two customerItems with the corresponding ids', (done) => {
			
			
			orderPlacedHandler.createCustomerItems(testOrder).then((order: Order) => {
				expect(order.orderItems[0].info.customerItem)
					.to.be.eql('customerItem1');
				
				expect(order.orderItems[1].info.customerItem)
					.to.be.eql('customerItem2');
				
				done();
			})
			
		});
	});
});