

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
	
	public validate(payment: Payment): Promise<boolean> {
		if (!payment) {
			return Promise.reject(new BlError('payment is not defined'));
		}
		
		return new Promise((resolve, reject) => {
			this.orderStorage.get(payment.order).then((order: Order) => {
				this.validatePayment(payment, order).then(() => {
					
					switch (payment.method) {
						case "later":
							return this.validatePaymentLater(payment);
						case "dibs":
							return this.validatePaymentDibs(payment, order);
						default:
							return Promise.reject(new BlError(`paymentMethod "${payment.method}" not supported`));
					}
					
				}).catch((blError: BlError) => {
					return reject(blError);
				})
			}).catch((blError: BlError) => {
				return reject(new BlError(`payment.order "${payment.order}" not found`).add(blError));
			})
		});
	}
	
	private validatePayment(payment: Payment, order: Order): Promise<boolean> {
		return new Promise((resolve, reject) => {
			if (payment.customer !== order.customer) {
				return reject(new BlError(`payment.customer "${payment.customer}" is not equal to order.customer "${order.customer}"`));
			}
			return resolve(true);
		});
	}
	
	private validatePaymentDibs(payment: Payment, order: Order): Promise<boolean> {
		if (order.amount !== payment.amount) {
			return Promise.reject(new BlError(`order.amount "${order.amount}" is not equal to payment.amount "${payment.amount}"`));
		}
		return Promise.reject('');
	}
	
	private validatePaymentLater(payment: Payment): Promise<boolean> {
		return Promise.resolve(true);
	}
}