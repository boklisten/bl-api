import {Hook} from "../../../hook/hook";
import {AccessToken, BlError, CustomerItem} from "@wizardcoder/bl-model";
import {CustomerItemValidator} from "../validators/customer-item-validator";
import {isNullOrUndefined} from "util";


export class CustomerItemPostHook extends Hook {
	private _customerItemValidator: CustomerItemValidator;

	constructor(customerItemValidator?: CustomerItemValidator) {
		super();
		this._customerItemValidator = (customerItemValidator) ? customerItemValidator : new CustomerItemValidator();
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
		return Promise.reject('not implememented');
	}

}