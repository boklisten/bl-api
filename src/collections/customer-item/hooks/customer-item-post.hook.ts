import {Hook} from "../../../hook/hook";
import {AccessToken, BlError, CustomerItem, Order, UserDetail} from "@wizardcoder/bl-model";
import {CustomerItemValidator} from "../validators/customer-item-validator";
import {isNullOrUndefined} from "util";
import {BlDocumentStorage} from "../../../storage/blDocumentStorage";
import {userDetailSchema} from "../../user-detail/user-detail.schema";
import {customerItemSchema} from "../customer-item.schema";
import {orderSchema} from "../../order/order.schema";
import {UserDetailHelper} from "../../user-detail/helpers/user-detail.helper";


export class CustomerItemPostHook extends Hook {
	private _customerItemValidator: CustomerItemValidator;
	private _userDetailStorage: BlDocumentStorage<UserDetail>;
	private _customerItemStorage: BlDocumentStorage<CustomerItem>;
	private _orderStorage: BlDocumentStorage<Order>;
	private _userDetailHelper: UserDetailHelper;

	constructor(customerItemValidator?: CustomerItemValidator, customerItemStorage?: BlDocumentStorage<CustomerItem>, userDetailStorage?: BlDocumentStorage<UserDetail>,
				orderStorage?: BlDocumentStorage<Order>, userDetailHelper?: UserDetailHelper) {
		super();
		this._customerItemValidator = (customerItemValidator) ? customerItemValidator : new CustomerItemValidator();
		this._userDetailStorage = (userDetailStorage) ? userDetailStorage : new BlDocumentStorage('userdetails', userDetailSchema);
		this._customerItemStorage = (customerItemStorage) ? customerItemStorage : new BlDocumentStorage('customeritems', customerItemSchema);
		this._orderStorage = (orderStorage) ? orderStorage : new BlDocumentStorage('orders', orderSchema);
		this._userDetailHelper = (userDetailHelper) ? userDetailHelper : new UserDetailHelper();
	}

	public before(customerItem: CustomerItem, accessToken: AccessToken, id?: string): Promise<boolean> {
		if (isNullOrUndefined(customerItem)) {
			return Promise.reject(new BlError('customerItem is undefined'));
		}

		return this._userDetailStorage.get(customerItem.customer).then((userDetail: UserDetail) => {
			if (!this._userDetailHelper.isValid(userDetail)) {
				throw new BlError(`userDetail "${customerItem.customer}" not valid`);
			}

			return this._customerItemValidator.validate(customerItem).then(() => {
				return true;
			}).catch((customerItemValidationError: BlError) => {
				throw new BlError('could not validate customerItem').add(customerItemValidationError);
			});
		}).catch((blError: BlError) => {
			throw blError;
		});

	}

	public after(customerItems: CustomerItem[], accessToken: AccessToken): Promise<CustomerItem[]> {
		// we know that the customerItem that is sent here are valid, we can just update the userDetail

		if (isNullOrUndefined(customerItems) || customerItems.length <= 0) {
			return Promise.reject(new BlError('customerItems is empty or undefined'));
		}

		if (customerItems.length > 1) {
			return Promise.reject(new BlError('there are more than one customerItem'));
		}

		let customerItem: CustomerItem = customerItems[0];

		if (isNullOrUndefined(customerItem.orders)) {
			return Promise.reject(new BlError('customerItem.orders is not defined'));
		}

		if (customerItem.orders.length !== 1) {
			return Promise.reject(new BlError(`customerItem.orders.length is "${customerItem.orders.length}" but should be "1"`));
		}

		return this._orderStorage.get(customerItem.orders[0])
			.then((order: Order) => { //update the corresponding orderItem with customerItem
				for (let orderItem of order.orderItems) {

					if (orderItem.item.toString() === customerItem.item.toString()) {
						orderItem.info = Object.assign({customerItem: customerItem.id}, orderItem.info);
						break;
					}
				}
				return this._orderStorage.update(order.id, {orderItems: order.orderItems}, {id: accessToken.sub, permission: accessToken.permission})
			}).then((updatedOrder: Order) => {
				return this._userDetailStorage.get(customerItem.customer);
			}).then((userDetail: UserDetail) => {
				let newCustomerItems = [];

				if (isNullOrUndefined(userDetail.customerItems) || (userDetail.customerItems && userDetail.customerItems.length === 0)) {
					newCustomerItems.push(customerItem.id);
				} else if (userDetail.customerItems && userDetail.customerItems.length > 0) {
					newCustomerItems = userDetail.customerItems;
					newCustomerItems.push(customerItem.id);
				}

				return this._userDetailStorage.update(userDetail.id, {customerItems: newCustomerItems}, {id: accessToken.sub, permission: accessToken.permission});
			}).then((updatedUserDetail: UserDetail) => {
				return [customerItem];
			}).catch((blError: BlError) => {
				throw blError
					.store('userDetail', accessToken.sub)
					.store('customerItemId', customerItem.id)
			});
	}

}