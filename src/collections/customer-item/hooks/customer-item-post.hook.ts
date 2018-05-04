import {Hook} from "../../../hook/hook";
import {AccessToken, BlError, CustomerItem, Order, UserDetail} from "@wizardcoder/bl-model";
import {CustomerItemValidator} from "../validators/customer-item-validator";
import {isNullOrUndefined} from "util";
import {BlDocumentStorage} from "../../../storage/blDocumentStorage";
import {userDetailSchema} from "../../user-detail/user-detail.schema";
import {customerItemSchema} from "../customer-item.schema";
import {orderSchema} from "../../order/order.schema";


export class CustomerItemPostHook extends Hook {
	private _customerItemValidator: CustomerItemValidator;
	private _userDetailStorage: BlDocumentStorage<UserDetail>;
	private _customerItemStorage: BlDocumentStorage<CustomerItem>;
	private _orderStorage: BlDocumentStorage<Order>;

	constructor(customerItemValidator?: CustomerItemValidator, customerItemStorage?: BlDocumentStorage<CustomerItem>, userDetailStorage?: BlDocumentStorage<UserDetail>,
				orderStorage?: BlDocumentStorage<Order>) {
		super();
		this._customerItemValidator = (customerItemValidator) ? customerItemValidator : new CustomerItemValidator();
		this._userDetailStorage = (userDetailStorage) ? userDetailStorage : new BlDocumentStorage('userdetails', userDetailSchema);
		this._customerItemStorage = (customerItemStorage) ? customerItemStorage : new BlDocumentStorage('customeritems', customerItemSchema);
		this._orderStorage = (orderStorage) ? orderStorage : new BlDocumentStorage('orders', orderSchema);
	}

	public before(customerItem: CustomerItem, accessToken: AccessToken, id?: string): Promise<boolean> {
		if (isNullOrUndefined(customerItem)) {
			return Promise.reject(new BlError('customerItem is undefined'));
		}

		return this._customerItemValidator.validate(customerItem).then(() => {
			return true;
		}).catch((customerItemValidationError: BlError) => {
			throw new BlError('could not validate customerItem').add(customerItemValidationError);
		});
	}

	public after(ids: string[], accessToken: AccessToken): Promise<boolean | CustomerItem[]> {
		// we know that the customerItem that is sent here are valid, we can just update the userDetail

		if (isNullOrUndefined(ids) || ids.length <= 0) {
			return Promise.reject(new BlError('ids is empty or undefined'));
		}

		if (ids.length > 1) {
			return Promise.reject(new BlError('there are more than one customerItem'));
		}

		let customerItem: CustomerItem;

		return this._customerItemStorage.get(ids[0])
			.then((retrievedCustomerItem: CustomerItem) => { // get correct order from customerItem

				if (isNullOrUndefined(retrievedCustomerItem.orders)) {
					throw new BlError('customerItem.orders is not defined');
				}

				if (retrievedCustomerItem.orders.length !== 1) {
					throw  new BlError(`customerItem.orders.length is "${retrievedCustomerItem.orders.length}" but should be "1"`);
				}

				customerItem = retrievedCustomerItem;

				return this._orderStorage.get(retrievedCustomerItem.orders[0]);
			}).then((order: Order) => { //update the corresponding orderItem with customerItem

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
					newCustomerItems.push(ids[0]);
				} else if (userDetail.customerItems && userDetail.customerItems.length > 0) {
					newCustomerItems = userDetail.customerItems;
					newCustomerItems.push(ids[0]);
				}

				return this._userDetailStorage.update(userDetail.id, {customerItems: newCustomerItems}, {id: accessToken.sub, permission: accessToken.permission});
			}).then((updatedUserDetail: UserDetail) => {
				return true;
			}).catch((blError: BlError) => {
				throw blError
					.store('userDetail', accessToken.sub)
					.store('customerItemIds', ids)
			});
	}

}