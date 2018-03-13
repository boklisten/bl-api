import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
import {expect} from 'chai';
import {OrderHook} from "./order.hook";
import {BlError, Branch, Order} from "bl-model";
import {OrderValidator} from "./order-validator/order-validator";
import {BlDocumentStorage} from "../../../storage/blDocumentStorage";
import {orderSchema} from "../order.schema";

chai.use(chaiAsPromised);


describe('OrderHook', () => {
	const orderValidator: OrderValidator = new OrderValidator();
	const orderHook: OrderHook = new OrderHook();
	const branchStorage: BlDocumentStorage<Branch> = new BlDocumentStorage('orders', orderSchema);
	
	describe('#run()', () => {
		
		let testOrder: Order;
		let testBranch: Branch;
		
		beforeEach(() => {
			testOrder = {
				id: 'o1',
				amount: 400,
				orderItems: [
					{
						type: "buy",
						amount: 300,
						item: 'i1',
						title: 'signatur',
						rentRate: 0,
						taxRate: 0,
						taxAmount: 0,
						unitPrice: 300
					},
					{
						type: "rent",
						amount: 100,
						item: 'i1',
						customerItem: 'ci1',
						title: 'signatur',
						rentRate: 0,
						taxRate: 0,
						taxAmount: 0,
						unitPrice: 300
					}
				],
				branch: 'b1',
				byCustomer: true,
				payments: [],
				delivery: '',
				comments: [],
				active: false,
				user: {
					id: 'u1'
				},
				lastUpdated: new Date(),
				creationTime: new Date()
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
					branchResponsible: false,
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
		
		sinon.stub(branchStorage, 'get').callsFake((id: string) => {
			return new Promise((resolve, reject) => {
				if (id === 'b1') return resolve(testBranch);
				reject(new BlError('not found'));
			});
		});
		
		sinon.stub(orderValidator, 'validate').callsFake(() => {
			return Promise.resolve(true);
		});
		
		context('when document is not valid', () => {
			/*
			it('should reject with error when doc is not an order', () => {
				return orderHook.after(['bbb'])
					.should.be.rejectedWith(BlError);
			});
			
			it('should reject with error when doc.data is empty', () => {
				return orderHook.after(['bbb'])
					.should.be.rejectedWith(BlError);
			});
			
			it('should reject with error when one of the docs in array are not valid', () => {
				return orderHook.run([
					new SEDocument('order', testOrder),
					new SEDocument('order', null)
				]).should.be.rejectedWith(BlError);
			});
			
			it('should reject with error when there are multiple docs of the same order', () => {
				return orderHook.run([
					new SEDocument('order', testOrder),
					new SEDocument('order', testOrder)
				]).should.be.rejectedWith(BlError);
			});
			*/
		});
	});
});