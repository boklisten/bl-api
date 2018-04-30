import {Hook} from "../../../hook/hook";
import {AccessToken, BlError, CustomerItem, UserDetail} from "@wizardcoder/bl-model";
import {CustomerItemValidator} from "../validators/customer-item-validator";
import {isNullOrUndefined} from "util";
import {BlDocumentStorage} from "../../../storage/blDocumentStorage";
import {userDetailSchema} from "../../user-detail/user-detail.schema";
import {customerItemSchema} from "../customer-item.schema";


export class CustomerItemPostHook extends Hook {
	private _customerItemValidator: CustomerItemValidator;
	private _userDetailStorage: BlDocumentStorage<UserDetail>;
	private _customerItemStorage: BlDocumentStorage<CustomerItem>;

	constructor(customerItemValidator?: CustomerItemValidator, customerItemStorage?: BlDocumentStorage<CustomerItem>, userDetailStorage?: BlDocumentStorage<UserDetail>) {
		super();
		this._customerItemValidator = (customerItemValidator) ? customerItemValidator : new CustomerItemValidator();
		this._userDetailStorage = (userDetailStorage) ? userDetailStorage : new BlDocumentStorage('userdetails', userDetailSchema);
		this._customerItemStorage = (customerItemStorage) ? customerItemStorage : new BlDocumentStorage('customeritems', customerItemSchema);
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


		return this._customerItemStorage.get(ids[0])
			.then((customerItem: CustomerItem) => {
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