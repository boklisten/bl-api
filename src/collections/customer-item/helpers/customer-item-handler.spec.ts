import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {BlError, Branch, CustomerItem, OrderItem} from '@wizardcoder/bl-model';
import {BlDocumentStorage} from "../../../storage/blDocumentStorage";
import {CustomerItemHandler} from "./customer-item-handler";
import {SystemUser} from "../../../auth/permission/permission.service";

chai.use(chaiAsPromised);

describe('CustomerItemHandler', () => {
	const customerItemStorage = new BlDocumentStorage<CustomerItem>('customeritems');
	const branchStorage = new BlDocumentStorage<Branch>('branches');
	const customerItemHandler = new CustomerItemHandler(customerItemStorage, branchStorage);


	const getCustomerItemStub = sinon.stub(customerItemStorage, 'get');
	const updateCustomerItemStub = sinon.stub(customerItemStorage, 'update');
	const getBranchStub = sinon.stub(branchStorage, 'get');

	describe('#extend()', () => {

		it('should reject if returned is true', () => {
			const customerItem = {
				deadline: new Date(),
				handout: true,
				returned: true
			};

			getCustomerItemStub.withArgs('customerItem1')
				.returns(Promise.resolve(customerItem));

			const orderItem = {} as OrderItem;

			return expect(customerItemHandler.extend('customerItem1', orderItem, 'branch1'))
				.to.be.rejectedWith(BlError, /can not extend when returned is true/);
		});

		it('should reject if orderItem.type is not extend', () => {
			const customerItem = {
				deadline: new Date(),
				handout: true,
				returned: false
			};

			getCustomerItemStub.withArgs('customerItem1')
				.returns(Promise.resolve(customerItem));

			const orderItem = {
				type: 'rent'
			} as OrderItem;

			return expect(customerItemHandler.extend('customerItem1', orderItem, 'branch1'))
				.to.be.rejectedWith(BlError, /orderItem.type is not "extend"/);
		});

		it('should reject if branch does not have the extend period', () => {
			const customerItem = {
				deadline: new Date(),
				handout: true,
				returned: false
			};

			getCustomerItemStub.withArgs('customerItem1')
				.returns(Promise.resolve(customerItem));

			const orderItem = {
				type: 'extend',
				info: {
					from: new Date(),
					to: new Date(),
					numberOfPeriods: 1,
					periodType: 'year',
					customerItem: 'customerItem1'
				}
			} as OrderItem;

			const branch = {
				paymentInfo: {
					extendPeriods: [
						{
							type: 'semester',
							date: new Date(),
							maxNumberOfPeriods: 1,
							price: 100
						}
					]
				}
			} as Branch;

			getBranchStub.withArgs('branch1').resolves(branch);

			return expect(customerItemHandler.extend('customerItem1', orderItem, 'branch1'))
				.to.be.rejectedWith(BlError, /extend period "year" is not present on branch/);
		});

		it('should update customerItem with new extend period and deadline', (done) => {
			const customerItem = {
				deadline: new Date(),
				handout: true,
				returned: false
			};

			getCustomerItemStub.withArgs('customerItem1')
				.returns(Promise.resolve(customerItem));

			const orderItem = {
				type: 'extend',
				info: {
					from: new Date(),
					to: new Date(2050, 1, 1),
					numberOfPeriods: 1,
					periodType: 'semester',
					customerItem: 'customerItem1'
				}
			} as OrderItem;

			const branch = {
				paymentInfo: {
					extendPeriods: [
						{
							type: 'semester',
							date: new Date(),
							maxNumberOfPeriods: 1,
							price: 100
						}
					]
				}
			} as Branch;

			getBranchStub.withArgs('branch1').resolves(branch);

			updateCustomerItemStub.resolves(customerItem);

			customerItemHandler.extend('customerItem1', orderItem, 'branch1').then(() => {
				expect(updateCustomerItemStub.getCalls()[0].args).to.eql(['customerItem1',
					{
						deadline: orderItem.info.to,
						periodExtends: [
							{
								from: orderItem.info.from,
								to: orderItem.info.to,
								periodType: orderItem.info.periodType,
								time: new Date()
							}
						]
					}, new SystemUser()]);
				done();
			}).catch((err) => {
				done(err);
			});
		});

	});

	describe('#buyout()', () => {
		it('should reject if orderItem.type is not "buyout"', () => {
			const orderItem = {
				type: 'rent'
			} as OrderItem;

			const customerItem = {} as CustomerItem;

			return expect(customerItemHandler.buyout('customerItem1', 'order1', orderItem))
				.to.be.rejectedWith('orderItem.type is not "buyout"');
		});

		it('should update customerItem with buyout', (done) => {
			const orderItem = {
				type: 'buyout'
			} as OrderItem;

			const customerItem = {
				buyout: false
			};

			getCustomerItemStub.resolves(customerItem);

			customerItemHandler.buyout('customerItem1', 'order1', orderItem).then(() => {
				expect(updateCustomerItemStub.getCalls()[1].args).to.eql([
					'customerItem1',
					{
						buyout: true,
						buyoutInfo: {
							order: 'order1'
						}
					},
					new SystemUser()
				]);
				done();
			}).catch((err) => {
				done(err);
			})

		});


	});

});