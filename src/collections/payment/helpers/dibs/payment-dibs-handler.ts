


import {DibsPaymentService} from "../../../../payment/dibs/dibs-payment.service";
import {DibsEasyOrder} from "../../../../payment/dibs/dibs-easy-order/dibs-easy-order";
import {BlError, Payment, Order, AccessToken, Delivery} from '@wizardcoder/bl-model';
import {BlDocumentStorage} from "../../../../storage/blDocumentStorage";
import {paymentSchema} from "../../payment.schema";
import {orderSchema} from "../../../order/order.schema";
import {SystemUser} from "../../../../auth/permission/permission.service";
import {deliverySchema} from "../../../delivery/delivery.schema";

export class PaymentDibsHandler {
	private paymentStorage: BlDocumentStorage<Payment>;
	private orderStorage: BlDocumentStorage<Order>;
	private dibsPaymentService: DibsPaymentService;
	private deliveryStorage: BlDocumentStorage<Delivery>;
	
	constructor(paymentStorage?: BlDocumentStorage<Payment>, orderStorage?: BlDocumentStorage<Order>, dibsPaymentService?: DibsPaymentService,
				deliveryStorage?: BlDocumentStorage<Delivery>) {
		this.paymentStorage = (paymentStorage) ? paymentStorage : new BlDocumentStorage('payments', paymentSchema);
		this.orderStorage = (orderStorage) ? orderStorage : new BlDocumentStorage('orders', orderSchema);
		this.dibsPaymentService = (dibsPaymentService) ? dibsPaymentService : new DibsPaymentService();
		this.deliveryStorage = (deliveryStorage) ? deliveryStorage : new BlDocumentStorage('deliveries', deliverySchema);
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
				return updatedPayment;
			}).catch((createDibsPaymentError: BlError) => {
				throw createDibsPaymentError;
			});
	}
	
	private getDibsEasyOrder(order: Order): Promise<DibsEasyOrder> {
		if (order.delivery) {
			return this.deliveryStorage.get(order.delivery).then((delivery: Delivery) => {
				return this.dibsPaymentService.orderToDibsEasyOrder(order, delivery);
			});
		}
		return Promise.resolve(this.dibsPaymentService.orderToDibsEasyOrder(order));
	}
}