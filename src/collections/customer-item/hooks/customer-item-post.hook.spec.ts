import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {AccessToken, BlError, CustomerItem, Order} from '@wizardcoder/bl-model';
import {BlDocumentStorage} from "../../../storage/blDocumentStorage";
import {CustomerItemValidator} from "../validators/customer-item-validator";
import {CustomerItemPostHook} from "./customer-item-post.hook";

chai.use(chaiAsPromised);

describe('CustomerItemPostHook', () => {
	let testCustomerItem: CustomerItem;
	let testOrder: Order;
	let testAccessToken: AccessToken;
	let validateCustomerItem: boolean;
	const customerItemStorage = new BlDocumentStorage<CustomerItem>('customeritems');
	const orderStorage = new BlDocumentStorage<Order>('orders');
	const customerItemValidator = new CustomerItemValidator(customerItemStorage);
	const customerItemPostHook = new CustomerItemPostHook(customerItemValidator);

	beforeEach(() => {
		testAccessToken = {
			iss: '',
			aud: '',
			iat: 1,
			exp: 1,
			sub: 'user1',
			username: '',
			permission: 'customer',
			details: 'userDetails1'
		};

		testCustomerItem = {
			id: 'customerItem1',
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
					title: 'signatur 1',
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


	describe('before()', () => {
		it('should reject if body paramenter is undefined', () => {
			return expect(customerItemPostHook.before(undefined, testAccessToken))
				.to.be.rejectedWith(BlError, /body is undefined/);
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
});


















