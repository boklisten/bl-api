import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {AccessToken, BlError, CustomerItem, Order, UserDetail} from '@wizardcoder/bl-model';
import {BlDocumentStorage} from "../../../storage/blDocumentStorage";
import {CustomerItemValidator} from "../validators/customer-item-validator";
import {CustomerItemPostHook} from "./customer-item-post.hook";
import * as sinonChai from 'sinon-chai';

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('CustomerItemPostHook', () => {
	let testCustomerItem: CustomerItem;
	let testOrder: Order;
	let testAccessToken: AccessToken;
	let validateCustomerItem: boolean;
	let testUserDetail: UserDetail;
	const customerItemStorage = new BlDocumentStorage<CustomerItem>('customeritems');
	const userDetailStorage = new BlDocumentStorage<UserDetail>('userdetails');
	const customerItemValidator = new CustomerItemValidator(customerItemStorage);
	const customerItemPostHook = new CustomerItemPostHook(customerItemValidator, customerItemStorage, userDetailStorage);

	beforeEach(() => {
		testAccessToken = {
			sub: 'user1',
			permission: 'customer',
			details: 'userDetail1'
		} as AccessToken;

		testUserDetail = {
			id: 'userDetail1',
			customerItems: []
		} as UserDetail;

		testCustomerItem = {
			id: 'customerItem1',
			customer: 'userDetail1' ,
			item: 'item1',
			deadline: new Date(),
			handout: true,
			handoutInfo: {
				handoutBy: 'branch',
				handoutById: 'branch1',
				handoutEmployee: 'employee1',
				time: new Date()
			},
			returned: false,
			orders: [
				'order1'
			]
		};

		testOrder = {
			id: '',
			amount: 100,
			orderItems: [
				{
					type: 'rent',
					item: 'item1',
					title: 'Signatur 1',
					amount: 100,
					unitPrice: 400,
					taxRate: 0,
					taxAmount: 0,
					info: {
						from: new Date(),
						to: new Date(),
						numberOfPeriods: 1,
						periodType: 'semester'
					}
				}
			],
			branch: 'branch1',
			customer: 'customer1',
			byCustomer: false,
			employee: 'employee1',
			placed: true,
			payments: []
		};

		validateCustomerItem = true;
	});

	sinon.stub(customerItemValidator, 'validate').callsFake((customerItem: CustomerItem) => {
		if (!validateCustomerItem) {
			return Promise.reject('could not validate');
		}
		return Promise.resolve(true);
	});

	sinon.stub(userDetailStorage, 'get').callsFake((id: string) => {
		if (id !== testUserDetail.id) {
			return Promise.reject(new BlError('userDetail not found'));
		}

		return Promise.resolve(testUserDetail);
	});

	sinon.stub(customerItemStorage, 'get').callsFake((id: string) => {
		if (id !== testCustomerItem.id) {
			return Promise.reject(new BlError('customerItem not found'));
		}
		return Promise.resolve(testCustomerItem);
	});

	const userDetailStub = sinon.stub(userDetailStorage, 'update').callsFake((id: string, data: any) => {
		return Promise.resolve(testUserDetail);
	});


	describe('before()', () => {
		it('should reject if customerItem parameter is undefined', () => {
			return expect(customerItemPostHook.before(undefined, testAccessToken))
				.to.be.rejectedWith(BlError, /customerItem is undefined/);
		});

		it('should reject if customerItemValidator.validate rejects', () => {
			validateCustomerItem = false;

			return expect(customerItemPostHook.before(testCustomerItem, testAccessToken))
				.to.be.rejectedWith(BlError, 'could not validate customerItem');
		});

		it('should resolve with true if customerItemValidator.validate resolves', () => {
			return expect(customerItemPostHook.before(testCustomerItem, testAccessToken))
				.to.be.fulfilled;
		});
	});

	describe('after()', () => {
		it('should reject if ids are empty', () => {
			return expect(customerItemPostHook.after([], testAccessToken))
				.to.be.rejectedWith(BlError, /ids is empty or undefined/);
		});

		it('should reject if ids are more than one', () => {
			return expect(customerItemPostHook.after(['ci1', 'ci2'], testAccessToken))
				.to.be.rejectedWith(BlError, /there are more than one customerItem/);
		});

		it('should reject if customerItem.customer is not defined', () => {
			testCustomerItem.customer = 'notFoundCustomer';

			return expect(customerItemPostHook.after(['customerItem1'], testAccessToken))
				.to.be.rejectedWith(BlError, /userDetail not found/);
		});

		it('should update userDetail with the ids array if it was empty', (done) => {
			testUserDetail.customerItems = [];
			let ids = ['customerItem1'];

			customerItemPostHook.after(ids, testAccessToken).then(() => {
				expect(userDetailStub.calledWithMatch('userDetail1', {customerItems: ['customerItem1']})).to.be.true;
				done();
			});
		});

		it('should add the new id to the old userDetail.customerItem array', (done) => {
			testUserDetail.customerItems = ['customerItem2'];
			let ids = ['customerItem1'];

			customerItemPostHook.after(ids, testAccessToken).then(() => {
				userDetailStub.should.have.been.calledWith('userDetail1', {customerItems: ['customerItem2', 'customerItem1']});
				done();
			})
		});

	});
});


















