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


describe('OrderHook', () => {
	
	
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
		
	});
});