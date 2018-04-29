import {BlError, CustomerItem} from "@wizardcoder/bl-model";
import {BlDocumentStorage} from "../../../storage/blDocumentStorage";
import {customerItemSchema} from "../customer-item.schema";
import {isNullOrUndefined} from "util";


export class CustomerItemValidator {
	private _customerItemStorage: BlDocumentStorage<CustomerItem>;

	constructor(customerItemStorage?: BlDocumentStorage<CustomerItem>) {
		this._customerItemStorage = (customerItemStorage) ? customerItemStorage : new BlDocumentStorage('customeritems', customerItemSchema);
	}

	public validate(customerItem: CustomerItem): Promise<boolean> {
		if (isNullOrUndefined(customerItem)) {
			return Promise.reject(new BlError('customerItem is undefined'));
		}

		return Promise.resolve(true);
	}
}