import {BlError, Branch, CustomerItem, OrderItem} from "@wizardcoder/bl-model";
import {BlDocumentStorage} from "../../../storage/blDocumentStorage";
import {Period} from "@wizardcoder/bl-model/dist/period/period";
import {SystemUser} from "../../../auth/permission/permission.service";
import {branchSchema} from "../../branch/branch.schema";
import {customerItemSchema} from "../customer-item.schema";

export class CustomerItemHandler {

	private _customerItemStorage: BlDocumentStorage<CustomerItem>;
	private _branchStorage: BlDocumentStorage<Branch>;

	constructor(customerItemStorage?: BlDocumentStorage<CustomerItem>, branchStorage?: BlDocumentStorage<Branch>) {
		this._customerItemStorage = (customerItemStorage) ? customerItemStorage : new BlDocumentStorage('customeritems', customerItemSchema);
		this._branchStorage = (branchStorage) ? branchStorage : new BlDocumentStorage('branches', branchSchema);
	}


	/**
	 * Extends the deadline of a customer item
	 * @param customerItemId
	 * @param orderItem
	 */
	public async extend(customerItemId: string, orderItem: OrderItem, branchId: string): Promise<CustomerItem> {
		try {
			const customerItem = await this._customerItemStorage.get(customerItemId);

			if (customerItem.returned) {
				return Promise.reject(new BlError('can not extend when returned is true'));
			}

			if (orderItem.type !== 'extend') {
				return Promise.reject(new BlError('orderItem.type is not "extend"'));
			}

			if (!orderItem.info || !orderItem.info.periodType) {
				return Promise.reject(new BlError('orderItem info is not present when type is "extend"'))
			}

			const branch = await this._branchStorage.get(branchId);

			const extendPeriod = this.getExtendPeriod(branch, orderItem.info.periodType);

			let periodExtends = (customerItem.periodExtends) ? customerItem.periodExtends : [];

			periodExtends.push({
				from: orderItem.info.from,
				to: orderItem.info.to,
				periodType: orderItem.info.periodType,
				time: new Date()
			});

			return await this._customerItemStorage.update(customerItemId, {
				deadline: orderItem.info.to,
				periodExtends: periodExtends
			}, new SystemUser());
		} catch (e) {
			throw e;
		}
	}

	private getExtendPeriod(branch: Branch, period: Period): {type: Period, date: Date, maxNumberOfPeriods: number, price: number} {
		if (!branch.paymentInfo.extendPeriods) {
			throw new BlError('no extend periods present on branch');
		}

		for (let extendPeriod of branch.paymentInfo.extendPeriods) {
			if (extendPeriod.type === period) {
				return extendPeriod;
			}
		}

		throw new BlError(`extend period "${period}" is not present on branch`);
	}


	/**
	 * Buyouts a customer item
	 * @param customerItemId
	 * @param orderId
	 * @param orderItem
	 */
	public async buyout(customerItemId: string, orderId: string, orderItem: OrderItem) {
		try {
			if (orderItem.type !== 'buyout') {
				return Promise.reject(`orderItem.type is not "buyout"`)
			}

			const customerItem = await this._customerItemStorage.get(customerItemId);

			return await this._customerItemStorage.update(customerItemId, {
				buyout: true,
				buyoutInfo: {
					order: orderId
				}
			}, new SystemUser());

		} catch (e) {
			throw e;
		}
	}


}