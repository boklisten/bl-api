

import {Hook} from "../../../hook/hook";
import {BlDocument, BlError, Order, Payment, AccessToken} from "@wizardcoder/bl-model";
import {BlDocumentStorage} from "../../../storage/blDocumentStorage";
import {paymentSchema} from "../payment.schema";
import {DibsPaymentService} from "../../../payment/dibs/dibs-payment.service";
import {DibsEasyOrder} from "../../../payment/dibs/dibs-easy-order/dibs-easy-order";
import {SystemUser} from "../../../auth/permission/permission.service";
import {orderSchema} from "../../order/order.schema";
import {PaymentValidator} from "../helpers/payment.validator";
import {isNullOrUndefined} from "util";
import {PaymentDibsHandler} from "../helpers/dibs/payment-dibs-handler";

export class PaymentPostHook extends Hook {
	
	private paymentStorage: BlDocumentStorage<Payment>;
	private orderStorage: BlDocumentStorage<Order>;
	private paymentValidator: PaymentValidator;
	private paymentDibsHandler: PaymentDibsHandler;
	
	constructor(paymentStorage?: BlDocumentStorage<Payment>, orderStorage?: BlDocumentStorage<Order>, paymentValidator?: PaymentValidator,
				paymentDibsHandler?: PaymentDibsHandler) {
		super();
		this.paymentValidator = (paymentValidator) ? paymentValidator : new PaymentValidator();
		this.paymentStorage = (paymentStorage) ? paymentStorage : new BlDocumentStorage('payments', paymentSchema);
		this.orderStorage = (orderStorage) ? orderStorage : new BlDocumentStorage('orders', orderSchema);
		this.paymentDibsHandler = (paymentDibsHandler) ? paymentDibsHandler : new PaymentDibsHandler();
	}
	
	public before(): Promise<boolean> {
		return new Promise((resolve, reject) => {
			resolve(true);
		});
	}
	
	public after(ids: string[], accessToken: AccessToken): Promise<boolean | BlDocument[]> {
		return new Promise((resolve, reject) => {
			if (!ids || ids.length != 1) {
				return reject(new BlError('ids is empty or undefined').store('ids', ids));
			}
			
			if (isNullOrUndefined(accessToken)) {
				return reject(new BlError('accessToken is undefined'));
			}
			
			this.paymentStorage.get(ids[0]).then((payment: Payment) => {
				this.paymentValidator.validate(payment).then(() => {
					this.handlePaymentBasedOnMethod(payment, accessToken).then((updatedPayment: Payment) => {

						this.updateOrderWithPayment(updatedPayment, accessToken).then(() => {
							resolve([updatedPayment]);
						}).catch(() => {
							reject(new BlError('order could not be updated with paymentId'));
						})
					}).catch((handlePaymentMethodError: BlError) => {
						reject(handlePaymentMethodError);
					})
				}).catch((blError: BlError) => {
					reject(new BlError('payment could not be validated').add(blError));
				})
			}).catch((blError: BlError) => {
				reject(new BlError('payment id not found').add(blError));
			});
		});
	}

	private handlePaymentBasedOnMethod(payment: Payment, accessToken: AccessToken): Promise<Payment> {
		return new Promise((resolve, reject) => {
			switch (payment.method) {
				case "dibs":
					return this.paymentDibsHandler.handleDibsPayment(payment, accessToken).then((updatedPayment: Payment) => {
						return resolve(updatedPayment);
					}).catch((blError: BlError) => {
						reject(blError);
					});
				default:
					return resolve(payment);
			}
		});
	}


	private updateOrderWithPayment(payment: Payment, accessToken: AccessToken): Promise<Payment> {
		return new Promise((resolve, reject) => {
			this.orderStorage.get(payment.order).then((order: Order) => {

				order.payments = (order.payments) ? order.payments : [];

				if (order.payments.indexOf(payment.id) <= -1) {
					order.payments.push(payment.id);
				}

				if (order.payments.length > 1) {
					reject(new BlError(`order.payments includes more than one payment`));
				}

				return this.orderStorage.update(order.id, {'payments': order.payments}, {id: accessToken.sub, permission: accessToken.permission}).then((updatedOrder: Order) => {
					resolve(payment);
				}).catch((blError: BlError) => {
					reject(new BlError('could not update orders').add(blError));
				});
			});
		});
	}

}

