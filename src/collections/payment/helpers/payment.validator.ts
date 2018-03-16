

import {Payment, Order, BlError, Branch, UserDetail} from 'bl-model';
import {BlDocumentStorage} from "../../../storage/blDocumentStorage";
import {orderSchema} from "../../order/order.schema";
import {branchSchema} from "../../branch/branch.schema";
import {userDetailSchema} from "../../user-detail/user-detail.schema";

export class PaymentValidator {
	private orderStorage?: BlDocumentStorage<Order>;
	private paymentStorage?: BlDocumentStorage<Payment>;
	private branchStorage?: BlDocumentStorage<Branch>;
	private userDetailStorage?: BlDocumentStorage<UserDetail>;
	
	constructor(orderStorage?: BlDocumentStorage<Order>, paymentStorage?: BlDocumentStorage<Payment>,
				branchStorage?: BlDocumentStorage<Branch>, userDetailStorage?: BlDocumentStorage<UserDetail>) {
		
		this.orderStorage = (orderStorage) ? orderStorage : new BlDocumentStorage('orders', orderSchema);
		this.paymentStorage = (paymentStorage) ? paymentStorage : new BlDocumentStorage('payments', paymentStorage);
		this.branchStorage = (branchStorage) ? branchStorage : new BlDocumentStorage('branches', branchSchema);
		this.userDetailStorage = (userDetailStorage) ? userDetailStorage : new BlDocumentStorage('userdetails', userDetailSchema);
	}
	
	public async validate(payment: Payment): Promise<boolean> {
		if (!payment) {
			return Promise.reject(new BlError('payment is not defined'));
		}
		
		try {
			switch (payment.method) {
				case "dibs":
					await this.validateDibsPayment(payment);
					break;
				case "later":
					break;
				default:
					return Promise.reject(new BlError(`paymentMethod "${payment.method}" not supported`));
			}
		} catch (e) {
			if (e instanceof BlError) {
				return Promise.reject(e);
			}
			return Promise.reject(new BlError('unkown error, could not validate payment').store('error', e));
		}
		
		return this.branchStorage.get(payment.branch).then((branch: Branch) => {
			return true;
		}).catch((blError: BlError) => {
			return Promise.reject(new BlError(`payment.branch "${payment.branch}" not found`).add(blError));
		});
	}
	
	private validateDibsPayment(payment): Promise<boolean> {
		return Promise.reject('');
	}
}