import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {Order, BlError} from "bl-model";
import {SEDocument} from "../../../db/model/se.document";
import {EndpointMongodb} from "../../../endpoint/endpoint.mongodb";
import {CustomerItemSchema} from "../../customer-item/customer-item.schema";
import {SESchema} from "../../../config/schema/se.schema";
import {ItemSchema} from "../../item/item.schema";
import {OrderValidator} from "./order-validator";

chai.use(chaiAsPromised);

class EndpointMongoDbMock extends EndpointMongodb {
	
	public getManyById(ids: string[]): Promise<SEDocument[]> {
		let returnItems: SEDocument[] = [];
		for (let id of ids) {
			if (!(['i1', 'i2', 'ci1', 'ci2'].indexOf(id) > -1)) return Promise.reject(new BlError('not found').code(702));
			returnItems.push(new SEDocument(this.schema.title, {id: id}));
		}
		return Promise.resolve(returnItems);
	}
}

describe('OrderValidator', () => {
	const itemMongoMock = new EndpointMongoDbMock(new SESchema('items', ItemSchema));
	const customerItemMongoMock = new EndpointMongoDbMock(new SESchema('items', CustomerItemSchema));
	const orderValidator: OrderValidator = new OrderValidator(itemMongoMock, customerItemMongoMock);
	
	let testOrder: Order;
	
	beforeEach(() => {
		testOrder = {
			id: 'o1',
			amount: 400,
			orderItems: [
				{
					type: "buy",
					amount: 300,
					item: 'i1'
				},
				{
					type: "rent",
					amount: 100,
					item: 'i1',
					customerItem: 'ci1'
				}
			],
			branch: 'b1',
			byCustomer: true,
			payments: [
				{
					method: "card",
					amount: 50.0,
					confirmed: true,
					byBranch: false,
					time: new Date()
				},
				{
					method: "cash",
					amount: 350.0,
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
	});
	
	describe('#validate()', () => {
		context('Order are not valid', () => {
			describe('should reject with BlError when', () => {
				
				it('order does not have the correct total amount', () => {
					testOrder.amount = 340;
					
					return orderValidator.validate(testOrder)
						.should.be.rejectedWith(BlError);
				});
				
				it('total of all payments in Order does not equal the total amount in Order', () => {
					testOrder.payments = [
						{
							method: "card",
							amount: 30,
							confirmed: true,
							byBranch: false,
							time: new Date()
						}
					];
					
					return orderValidator.validate(testOrder)
						.should.be.rejectedWith(BlError);
				});
				
				it('orderItem is of type "rent" but does not have a customerItem id', () => {
					testOrder.orderItems = [
						{
							type: "rent",
							amount: 400,
							item: 'i1'
						}
					];
					
					return orderValidator.validate(testOrder)
						.should.be.rejectedWith(BlError);
				});
			});
		});
		context('CustomerItems is not valid', () => {
			it('should reject with BlError when a customerItem does not exist', () => {
				testOrder.orderItems = [
					{
						type: "rent",
						amount: 400,
						item: 'i1',
						customerItem: 'notValidId'
					}
				];
				
				return orderValidator.validate(testOrder)
					.should.be.rejectedWith(BlError);
			});
		});
		
		context('items of orderItems is not valid', () => {
			it('should reject with BlError when a item does not exist', () => {
				testOrder.orderItems = [
					{
						type: "rent",
						amount: 400,
						item: 'notValid',
						customerItem: 'ci1'
					}
				];
				
				return orderValidator.validate(testOrder)
					.should.be.rejectedWith(BlError);
			});
		});
	});
});