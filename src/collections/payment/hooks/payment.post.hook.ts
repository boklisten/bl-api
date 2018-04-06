

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

export class PaymentPostHook extends Hook {
	
	private paymentStorage: BlDocumentStorage<Payment>;
	private orderStorage: BlDocumentStorage<Order>;
	private paymentValidator: PaymentValidator;
	
	constructor(paymentStorage?: BlDocumentStorage<Payment>, orderStorage?: BlDocumentStorage<Order>, paymentValidator?: PaymentValidator) {
		super();
		this.paymentValidator = (paymentValidator) ? paymentValidator : new PaymentValidator();
		this.paymentStorage = (paymentStorage) ? paymentStorage : new BlDocumentStorage('payments', paymentSchema);
		this.orderStorage = (orderStorage) ? orderStorage : new BlDocumentStorage('orders', orderSchema);
	}
	
	public before(): Promise<boolean> {
		return new Promise((resolve, reject) => {
			resolve(true);
		});
	}
	
	public after(ids: string[], accessToken: AccessToken): Promise<boolean | BlDocument[]> {
		return new Promise((resolve, reject) => {
			if (!ids || ids.length != 1) {
				reject(new BlError('ids is empty or undefined').store('ids', ids));
			}
			
			if (isNullOrUndefined(accessToken)) {
				reject(new BlError('accessToken is undefined'));
			}
			
			this.paymentStorage.get(ids[0]).then((payment: Payment) => {
				this.paymentValidator.validate(payment).then(() => {
					switch (payment.method) {
						case "later":
							return this.handleLaterPayment(payment, accessToken).then((payment: Payment) => {
								return resolve([payment]);
							}).catch((blError: BlError) => {
								return reject(blError);
							});
						case "dibs":
							return this.handleDibsPayment(payment, accessToken).then((payment) => {
								return resolve([payment]);
							}).catch((blError: BlError) => {
								reject(blError);
							});
						default:
							break;
					}
				}).catch((blError: BlError) => {
					reject(new BlError('payment could not be validated').add(blError));
				})
			}).catch((blError: BlError) => {
				reject(new BlError('payment id not found').add(blError));
			});
		});
	}
	
	private handleLaterPayment(payment: Payment, accessToken: AccessToken): Promise<Payment> {
		return new Promise((resolve, reject) => {
			this.orderStorage.get(payment.order).then((order: Order) => {
				if (order.payments && order.payments.length > 0) {
					return reject(new BlError('there is more than one payment in order.payments'));
				}
				
				order.payments = [payment.id];
				
				this.orderStorage.update(order.id, {payments: order.payments}, {id: accessToken.sub, permission: accessToken.permission}).then((updatedOrder: Order) => {
					this.paymentStorage.update(payment.id, {confirmed: true}, {id: accessToken.sub, permission: accessToken.permission}).then((updatedPayment: Payment) => {
						resolve(updatedPayment);
					}).catch((paymentUpdateError) => {
						reject(new BlError('payment.confirmed could not be updated to "true"').add(paymentUpdateError));
					});
				}).catch((orderUpdateError: BlError) => {
					reject(new BlError('could not update order with the payment id').add(orderUpdateError));
				});
			}).catch((orderGetError: BlError) => {
				reject(orderGetError);
			});
		});
	}

	private handleDibsPayment(payment: Payment, accessToken: AccessToken): Promise<Payment> {
		return new Promise((resolve, reject) => {
			this.orderStorage.get(payment.order).then((order: Order) => {
				
				const dibsPayment = new DibsPaymentService();
				let deo: DibsEasyOrder;
				
				try {
					deo = dibsPayment.orderToDibsEasyOrder(order);
				} catch (e) {
					if (e instanceof BlError) {
						reject(new BlError('could not create dibsEasyOrder').add(e));
					}
					reject(new BlError('unknown error, the order could not be made to a dibs easy order'));
				}
				
				dibsPayment.getPaymentId(deo).then((paymentId: string) => {
					this.paymentStorage.update(payment.id, {"info": {"paymentId": paymentId}}, new SystemUser()).then((updatedPayment: Payment) => {
						
						this.updateOrderWithPaymentId(updatedPayment.order, updatedPayment.id, accessToken).then((updatedOrder: Order) => {
							resolve(updatedPayment);
						}).catch((orderUpdateError: BlError) => {
							reject(orderUpdateError);
						});
						
					}).catch((blError: BlError) => {
						reject(new BlError(`could not update payment "${payment.id}" with paymentId`))
					});
				}).catch((blError: BlError) => {
					reject(blError);
				});
			}).catch((blError: BlError) => {
				reject(new BlError(`payment.order "${payment.order}" does not exists in database`).add(blError));
			});
		});
	}
	
	private updateOrderWithPaymentId(orderId: string, paymentId: string, accessToken: AccessToken): Promise<Order> {
		return new Promise((resolve, reject) => {
		    this.orderStorage.get(orderId).then((order: Order) => {
		    	
		    	order.payments.push(paymentId);
		    	
		    	this.orderStorage.update(orderId, {'payments': order.payments}, {id: accessToken.sub, permission: accessToken.permission}).then((updatedOrder: Order) => {
		    		resolve(updatedOrder);
				}).catch((blError: BlError) => {
		    		reject(blError);
				});
			}).catch((orderError: BlError) => {
		    	reject(orderError);
			})
		});
	}
}

