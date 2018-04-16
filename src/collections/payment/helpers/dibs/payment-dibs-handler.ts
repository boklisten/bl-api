


import {DibsPaymentService} from "../../../../payment/dibs/dibs-payment.service";
import {DibsEasyOrder} from "../../../../payment/dibs/dibs-easy-order/dibs-easy-order";
import {BlError, Payment, Order, AccessToken} from '@wizardcoder/bl-model';
import {BlDocumentStorage} from "../../../../storage/blDocumentStorage";
import {paymentSchema} from "../../payment.schema";
import {orderSchema} from "../../../order/order.schema";
import {SystemUser} from "../../../../auth/permission/permission.service";

export class PaymentDibsHandler {
	private paymentStorage: BlDocumentStorage<Payment>;
	private orderStorage: BlDocumentStorage<Order>;
	private dibsPaymentService: DibsPaymentService;
	
	constructor(paymentStorage?: BlDocumentStorage<Payment>, orderStorage?: BlDocumentStorage<Order>, dibsPaymentService?: DibsPaymentService) {
		this.paymentStorage = (paymentStorage) ? paymentStorage : new BlDocumentStorage('payments', paymentSchema);
		this.orderStorage = (orderStorage) ? orderStorage : new BlDocumentStorage('orders', orderSchema);
		this.dibsPaymentService = (dibsPaymentService) ? dibsPaymentService : new DibsPaymentService();
	}
	
	public handleDibsPayment(payment: Payment, accessToken: AccessToken): Promise<Payment> {
		let order: Order;
		
		return this.orderStorage.get(payment.order).then((theOrder: Order) => {
				order = theOrder;
				return this.getDibsEasyOrder(theOrder);
			}).then((dibsEasyOrder: DibsEasyOrder) => {
				return this.dibsPaymentService.getPaymentId(dibsEasyOrder);
			}).then((paymentId: string) => {
				return this.paymentStorage.update(payment.id, {info: {paymentId: paymentId}}, {id: accessToken.sub, permission: accessToken.permission});
			}).then((updatedPayment: Payment) => {
				payment = updatedPayment;
				return this.updateOrderWithPayment(order, updatedPayment, accessToken);
			}).then((updatedOrder: Order) => {
				return payment;
			}).catch((createDibsPaymentError: BlError) => {
				throw createDibsPaymentError;
			});
	}
	
	private getDibsEasyOrder(order: Order): DibsEasyOrder {
		try {
			return this.dibsPaymentService.orderToDibsEasyOrder(order);
		} catch (e) {
			throw new BlError('could not create dibs easy order').store('order', order);
		}
	}
	
	private updateOrderWithPayment(order: Order, payment: Payment, accessToken: AccessToken): Promise<Order> {
		order.payments = (order.payments) ? order.payments : [];
		
		if (order.payments.indexOf(payment.id) <= -1) {
			order.payments.push(payment.id);
		}
		
		if (order.payments.length > 1) {
			throw new BlError(`order.payments includes more than one payment`);
		}
		
		return this.orderStorage.update(order.id, {'payments': order.payments}, {id: accessToken.sub, permission: accessToken.permission}).then((updatedOrder: Order) => {
			return updatedOrder;
		}).catch((blError: BlError) => {
			throw blError;
		});
	}
}