

import {Order, Delivery, Payment, BlError} from 'bl-model';
import {BlDocumentStorage} from "../../../../../storage/blDocumentStorage";
import {deliverySchema} from "../../../../delivery/delivery.schema";
import {paymentSchema} from "../../../../payment/payment.schema";
import {isNullOrUndefined} from "util";

export class OrderPlacedValidator {
	private deliveryStorage: BlDocumentStorage<Delivery>;
	private paymentStorage: BlDocumentStorage<Payment>;
	
	constructor(deliveryStorage?: BlDocumentStorage<Delivery>, paymentStorage?: BlDocumentStorage<Payment>) {
		this.deliveryStorage = (deliveryStorage) ? deliveryStorage : new BlDocumentStorage('deliveries', deliverySchema);
		this.paymentStorage = (paymentStorage) ? paymentStorage : new BlDocumentStorage('payments', paymentSchema);
	}
	
	public validate(order: Order): Promise<boolean> {
		return new Promise((resolve, reject) => {
		    if (!order.placed) {
				resolve(true);
			}
			
			if (isNullOrUndefined(order.delivery)) {
				return reject(new BlError('order.placed is set but delivery is undefined'));
			}
			
			if (isNullOrUndefined(order.payments) || order.payments.length <= 0) {
				return reject(new BlError('order.placed is set but order.payments is empty or undefined'));
			}
			
			this.deliveryStorage.get(order.delivery).then((delivery: Delivery) => {
				
				let orderItemTotalAmount = 0;
				
				for (let orderItem of order.orderItems) {
					orderItemTotalAmount += orderItem.amount;
				}
				
				if ((orderItemTotalAmount + delivery.amount) !== order.amount) {
					reject(new BlError('total of order.orderItems amount + delivery.amount is not equal to order.amount'));
				}
				
				this.paymentStorage.getMany(order.payments).then((payments: Payment[]) => {
					
					let paymentTotal = 0;
					for (let payment of payments) {
						if (!payment.confirmed) {
							return reject(new BlError('payment is not confirmed').store('paymentId', payment.id));
						}
						paymentTotal += payment.amount;
					}
					
					if (paymentTotal != order.amount) {
						return reject(new BlError('total amount of payments is not equal to order.amount'));
					}
					
					resolve(true); // order can be placed
				}).catch((blError: BlError) => {
					reject(new BlError('order.payments is not found').code(702).add(blError));
				});
				
			
			}).catch((blError: BlError) => {
				reject(new BlError('order.placed is set but delivery was not found').add(blError));
			});
		});
	}
}