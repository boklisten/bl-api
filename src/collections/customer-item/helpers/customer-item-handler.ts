import {BlError, Branch, CustomerItem, OrderItem} from "@wizardcoder/bl-model";
import {BlDocumentStorage} from "../../../storage/blDocumentStorage";
import {SystemUser} from "../../../auth/permission/permission.service";
import {branchSchema} from "../../branch/branch.schema";
import {customerItemSchema} from "../customer-item.schema";
import {Period} from "@wizardcoder/bl-model/dist/period/period";
import { SEDbQuery } from '../../../query/se.db-query';
import { SEDbQueryBuilder } from '../../../query/se.db-query-builder';
import moment = require('moment');

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
	public async extend(customerItemId: string, orderItem: OrderItem, branchId: string, orderId: string): Promise<CustomerItem> {
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

			let customerItemOrders = (customerItem.orders) ? customerItem.orders : [];

			periodExtends.push({
				from: orderItem.info.from,
				to: orderItem.info.to,
				periodType: orderItem.info.periodType,
				time: new Date()
			});

			customerItemOrders.push(orderId);

			return await this._customerItemStorage.update(customerItemId, {
				deadline: orderItem.info.to,
				periodExtends: periodExtends,
				orders: customerItemOrders
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
			let customerItemOrders = (customerItem.orders) ? customerItem.orders : [];

			customerItemOrders.push(orderId);

			return await this._customerItemStorage.update(customerItemId, {
				buyout: true,
				orders: customerItemOrders,
				buyoutInfo: {
					order: orderId
				}
			}, new SystemUser());

		} catch (e) {
			throw e;
		}
  }

  /**
   * Fetches a customers customerItems not returned for the specified deadline
   * @param customerId the customer to look for
   * @param deadline the deadline of the customerItem
   */
  public async getNotReturned(customerId: string, deadline: Date): Promise<CustomerItem[]> {
    if (customerId == null || customerId.length <= 0) {
      throw new BlError('customerId is null or undefined');
    }

    if (deadline == null) {
      throw new BlError('deadline is null or undefined');
    }

    const deadlineString = moment(deadline).format('DDMMYYYYHHmm');

    const query = {
      customer: customerId.toString(),
      deadline: '<' + deadlineString,
      returned: 'false'
    }

    const dbQueryBuilder = new SEDbQueryBuilder();

    const dbQuery = dbQueryBuilder.getDbQuery(query, [
      {fieldName: 'customer', type: 'string'},
      {fieldName: 'deadline', type: 'date'},
      {fieldName: 'returned', type: 'boolean'}
    ]);

    return await this._customerItemStorage.getByQuery(dbQuery);
  }
}
