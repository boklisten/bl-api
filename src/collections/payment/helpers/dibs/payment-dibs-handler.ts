


import {DibsPaymentService} from "../../../../payment/dibs/dibs-payment.service";
import {DibsEasyOrder} from "../../../../payment/dibs/dibs-easy-order/dibs-easy-order";
import {BlError, Payment, Order} from '@wizardcoder/bl-model';
import {BlDocumentStorage} from "../../../../storage/blDocumentStorage";
import {paymentSchema} from "../../payment.schema";
import {orderSchema} from "../../../order/order.schema";
import {SystemUser} from "../../../../auth/permission/permission.service";

class PaymentDibsHandler {
	private paymentStorage: BlDocumentStorage<Payment>;
	private orderStorage: BlDocumentStorage<Order>;
	
	constructor(paymentStorage?: BlDocumentStorage<Payment>, orderStorage?: BlDocumentStorage<Order>) {
		this.paymentStorage = (paymentStorage) ? paymentStorage : new BlDocumentStorage('payments', paymentSchema);
		this.orderStorage = (orderStorage) ? orderStorage : new BlDocumentStorage('orders', orderSchema);
	}
	
	
	
	private dibsPayment(payment: Payment) {
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
					reject(new BlError('unkown error, the order could not be made to a dibs easy order'));
				}
				
				dibsPayment.getPaymentId(deo).then((paymentId: string) => {
					this.paymentStorage.update(payment.id, {"info": {"paymentId": paymentId}}, new SystemUser()).then((updatedPayment: Payment) => {
						
						this.orderStorage.get(updatedPayment.order).then((order) => {
							order.payments.push(updatedPayment.id);
							
							this.orderStorage.update(updatedPayment.order, {"payments": order.payments}, new SystemUser()).then(() => {
								resolve(updatedPayment);
							}).catch((blError: BlError) => {
								reject(new BlError(`could not update order "${updatedPayment.order}" with the payment "${payment.id}"`).add(blError));
							});
							
						}).catch((blErr: BlError) => {
							reject(blErr);
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
}