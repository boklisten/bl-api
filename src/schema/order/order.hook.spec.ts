import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {OrderHook} from "./order.hook";
import {BlError, Order} from "bl-model";
import {EndpointMongodb} from "../../endpoint/endpoint.mongodb";
import {SEDocument} from "../../db/model/se.document";
import {SESchema} from "../../config/schema/se.schema";
import {ItemSchema} from "../item/item.schema";
import {CustomerItemSchema} from "../customer-item/customer-item.schema";

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

describe('OrderHook', () => {
	
	const itemMongoMock = new EndpointMongoDbMock(new SESchema('items', ItemSchema));
	const customerItemMongoMock = new EndpointMongoDbMock(new SESchema('items', CustomerItemSchema));
	
	
	const orderHook: OrderHook = new OrderHook(itemMongoMock, customerItemMongoMock);
	
	describe('#run()', () => {
		let validOrder: Order = new Order();
		beforeEach(() => {
			validOrder = {
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
		
		context('no documents provided', () => {
			it('should reject with BlError', () => {
				
				return orderHook.run([])
					.should.be.rejectedWith(BlError);
			
			});
		});
		
		context('document are not of valid type', () => {
			it('should reject with BlError when documentName is not "Order"', () => {
				return orderHook.run([{documentName: 'someOtherValue', data: null}])
					.should.be.rejectedWith(BlError);
			});
			
			it('should reject with BlError when data is not defined', () => {
				return orderHook.run([{documentName: 'order', data: null}])
					.should.be.rejectedWith(BlError);
			});
		});
		
		
		
		
		
	});
});