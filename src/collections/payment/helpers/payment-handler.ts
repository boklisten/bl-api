

import {AccessToken, BlError, Order, Payment} from "@wizardcoder/bl-model";
import {BlDocumentStorage} from "../../../storage/blDocumentStorage";
import {paymentSchema} from "../payment.schema";
import {DibsPaymentService} from "../../../payment/dibs/dibs-payment.service";
import {DibsEasyPayment} from "../../../payment/dibs/dibs-easy-payment/dibs-easy-payment";
import {isNullOrUndefined} from "util";

export class PaymentHandler {
	private paymentStorage: BlDocumentStorage<Payment>;
	private dibsPaymentService: DibsPaymentService;
	
	constructor(paymentStorage?: BlDocumentStorage<Payment>, dibsPaymentService?: DibsPaymentService) {
		this.paymentStorage = (paymentStorage) ? paymentStorage : new BlDocumentStorage('payments', paymentSchema);
		this.dibsPaymentService = (dibsPaymentService) ? dibsPaymentService : new DibsPaymentService();
	}
	
	public confirmPayments(order: Order, accessToken: AccessToken): Promise<Payment[]> {
		return new Promise((resolve, reject) => {
			if (!order.payments || order.payments.length <= 0) {
				resolve([]);
			}
			
			this.paymentStorage.getMany(order.payments).then((payments: Payment[]) => {
				
				for (let payment of payments) {
					if (payment.confirmed) {
						return reject(new BlError(`payment "${payment.id}" is already confirmed`))
					}
				}
				
				if (payments.length > 1) {
					this.confirmMultiplePayments(order, payments).then(() => {
					
					}).catch((confirmError: BlError) => {
						reject(confirmError);
					});
				} else {
					
					this.confirmBasedOnPaymentMethod(order, payments[0]).then(() => {
						this.paymentStorage.update(payments[0].id, {confirmed: true}, {id: accessToken.sub, permission: accessToken.permission}).then((updatedPayment: Payment) => {
							resolve([updatedPayment]);
						}).catch((updateError: BlError) => {
							reject(new BlError('could not set payment.confirmed to true').add(updateError));
						});
					}).catch((confirmPaymentError: BlError) => {
						reject(confirmPaymentError);
					});
				}
			}).catch((paymentNotFoundError: BlError) => {
				reject(new BlError('one or more payments was not found').add(paymentNotFoundError))
			})
		});
	}
	
	private confirmMultiplePayments(order: Order, payments: Payment[]) {
		if (payments.length > 1) {
			for (let payment of payments) {
				if (payment.method === 'dibs') {
					return Promise.reject(new BlError(`there was multiple payments but only one is allowed if one has method "${payment.method}"`));
				}
			}
		}
	}
	
	private confirmBasedOnPaymentMethod(order: Order, payment: Payment): Promise<boolean> {
		switch (payment.method) {
			case 'dibs':
				return this.confirmMethodDibs(order, payment);
			case 'card':
				return this.confirmMethodCard(order, payment);
			case 'cash':
				return this.confirmMethodCash(order, payment);
			default:
				return Promise.reject(new BlError(`payment method "${payment.method}" not supported`));
		}
	}

	private confirmMethodCard(order: Order, payment: Payment): Promise<boolean> {
		return Promise.resolve(true);
	}

	private confirmMethodCash(order: Order, payment: Payment): Promise<boolean> {
		return Promise.resolve(true);
	}
	
	
	private confirmMethodDibs(order: Order, payment: Payment): Promise<boolean> {
		return new Promise((resolve, reject) => {
			if (isNullOrUndefined(payment.info)) {
				return reject(new BlError('payment.method is "dibs" but payment.info is undefined'));
			}
			
			if (isNullOrUndefined(payment.info['paymentId'])) {
				return reject(new BlError('payment.method is "dibs" but payment.info.paymentId is undefined'))
			}
			
			this.dibsPaymentService.getDibsPayment(payment.info['paymentId']).then((dibsEasyPayment: DibsEasyPayment) => {
				if (isNullOrUndefined(dibsEasyPayment.orderDetails)) {
					reject(new BlError('dibsEasyPayment was found, but dibsEasyPayment.orderDetails was undefined').store('dibsEasyPayment', dibsEasyPayment).store('orderDetails', dibsEasyPayment['orderDetails']));
				}
				
				if (dibsEasyPayment.orderDetails.reference !== order.id) {
					reject(new BlError('dibsEasyPayment.orderDetails.reference is not equal to order.id').store('dibsEasyPayment', dibsEasyPayment))
				}
				
				if (isNullOrUndefined(dibsEasyPayment.summary)) {
					reject(new BlError('dibsEasyPayment.summary is undefined').store('dibsEasyPayment', dibsEasyPayment));
				}
				
				if (isNullOrUndefined(dibsEasyPayment.summary.reservedAmount)) {
					reject(new BlError('dibsEasyPayment.summary.reservedAmount is undefined').store('dibsEasyPayment', dibsEasyPayment));
				}
				
				if (dibsEasyPayment.summary.reservedAmount !== (payment.amount * 100)) {
					reject(new BlError(`dibsEasyPayment.summary.reservedAmount "${dibsEasyPayment.summary.reservedAmount}" is not equal to payment.amount "${(payment.amount * 100)}"`).store('dibsEasyPayment', dibsEasyPayment));
				}
				
				resolve(true);
				
			}).catch((getDibsPaymentError: BlError) => {
				reject(new BlError('could not get dibs payment on dibs api').add(getDibsPaymentError));
			})
		});
	}
}