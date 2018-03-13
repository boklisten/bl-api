

import {Hook} from "../../../hook/hook";
import {BlDocument, BlError, Order, Payment} from "bl-model";
import {BlDocumentStorage} from "../../../storage/blDocumentStorage";
import {paymentSchema} from "../payment.schema";
import {OrderSchema} from "../../../schema/order/order.schema";
import {DibsPayment} from "../../../payment/dibs/dibs-payment";
import {DibsEasyOrder} from "../../../payment/dibs/dibs-easy-order/dibs-easy-order";
import {SystemUser} from "../../../auth/permission/permission.service";

export class PaymentPostHook extends Hook {
	
	private paymentStorage: BlDocumentStorage<Payment>;
	private orderStorage: BlDocumentStorage<Order>;
	
	constructor() {
		super();
		this.paymentStorage = new BlDocumentStorage('payments', paymentSchema);
		this.orderStorage = new BlDocumentStorage('orders', OrderSchema);
	}
	
	public before(): Promise<boolean> {
		return new Promise((resolve, reject) => {
			resolve(true);
		});
	}
	
	public after(ids: string[]): Promise<boolean | BlDocument> {
		return new Promise((resolve, reject) => {
			if (!ids || ids.length != 1) {
				reject(new BlError(`length is undefined or not a single id`).store('ids', ids));
			}
			this.paymentStorage.get(ids[0]).then((payment: Payment) => {
				
				switch (payment.method) {
					case "dibs":
						this.dibsPayment(payment).then((updatedPayment: Payment) => {
							resolve(updatedPayment);
						}).catch((blError: BlError) => {
							reject(blError);
						});
						break;
					default:
						break;
				}
			}).catch((blError: BlError) => {
				reject(new BlError('hook failed').add(blError));
			});
			
		});
	}
	
	private dibsPayment(payment: Payment) {
		return new Promise((resolve, reject) => {
			this.orderStorage.get(payment.order).then((order: Order) => {
				
				const dibsPayment = new DibsPayment();
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