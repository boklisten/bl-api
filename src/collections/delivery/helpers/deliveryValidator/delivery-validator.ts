
import {Delivery, BlError, Order} from '@wizardcoder/bl-model';
import {DeliveryBranchHandler} from "../deliveryBranch/delivery-branch-handler";
import {isNullOrUndefined} from "util";
import {BlDocumentStorage} from "../../../../storage/blDocumentStorage";
import {orderSchema} from "../../../order/order.schema";
import {DeliveryBringHandler} from "../deliveryBring/delivery-bring-handler";

export class DeliveryValidator {
	private deliveryBranchHandler: DeliveryBranchHandler;
	private deliveryBringHandler: DeliveryBringHandler;
	private orderStorage: BlDocumentStorage<Order>;
	
	constructor(orderStorage?: BlDocumentStorage<Order>, deliveryBranchHandler?: DeliveryBranchHandler, deliveryBringHandler?: DeliveryBringHandler) {
		this.orderStorage = (orderStorage) ? orderStorage : new BlDocumentStorage('orders', orderSchema);
		this.deliveryBranchHandler = (deliveryBranchHandler) ? deliveryBranchHandler : new DeliveryBranchHandler();
		this.deliveryBringHandler = (deliveryBringHandler) ? deliveryBringHandler : new DeliveryBringHandler();
	}
	
	public validate(delivery: Delivery, order: Order): Promise<boolean> {
		
		if (isNullOrUndefined(delivery.method)) {
			return Promise.reject(new BlError('delivery.method not defined'));
		}
		
		return this.validateBasedOnMethod(delivery, order);
	}
	
	private validateBasedOnMethod(delivery: Delivery, order: Order): Promise<boolean> {
		switch (delivery.method) {
			case "branch":
				return this.deliveryBranchHandler.validate(delivery);
			case "bring":
				return this.deliveryBringHandler.validate(delivery, order);
			default:
				return Promise.reject(new BlError(`delivery.method "${delivery.method}" is not supported`).store('delivery', delivery));
		}
	}
}