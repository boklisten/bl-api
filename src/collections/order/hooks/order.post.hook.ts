

import {Hook} from "../../../hook/hook";
import {BlError, Order, UserDetail, Payment, Delivery, Branch, Item, AccessToken} from "bl-model";
import {OrderValidator} from "../helpers/order-validator/order-validator";
import {BlDocumentStorage} from "../../../storage/blDocumentStorage";
import {userDetailSchema} from "../../user-detail/user-detail.schema";
import {orderSchema} from "../order.schema";
import {OrderHookBefore} from "./order-hook-before";
import {isNullOrUndefined} from "util";

export class OrderPostHook extends Hook {
	private orderValidator: OrderValidator;
	private userDetailStorage: BlDocumentStorage<UserDetail>;
	private orderStorage: BlDocumentStorage<Order>;
	private orderHookBefore: OrderHookBefore;
	
	constructor(orderValidator?: OrderValidator, orderHookBefore?: OrderHookBefore,
				userDetailStorage?: BlDocumentStorage<UserDetail>, orderStorage?: BlDocumentStorage<Order>) {
		super();
		this.orderValidator = (orderValidator) ? orderValidator : new OrderValidator();
		this.orderHookBefore = (orderHookBefore) ? orderHookBefore : new OrderHookBefore();
		this.userDetailStorage = (userDetailStorage) ? userDetailStorage : new BlDocumentStorage('userdetails', userDetailSchema);
		this.orderStorage = (orderStorage) ? orderStorage : new BlDocumentStorage('orders', orderSchema);
	}
	
	public before(requestBody: any): Promise<boolean> {
		return this.orderHookBefore.validate(requestBody);
	}

	public after(orderIds: string[], accessToken?: AccessToken): Promise<boolean | Order[]> {
		if (isNullOrUndefined(accessToken) || accessToken.sub.length <= 0) {
			return Promise.reject(new BlError('accessToken was not specified when trying to process order'))
		}
		
		if (!orderIds || orderIds.length <= 0) {
			return Promise.reject(new BlError('no documents provided').code(701));
		}
		
		if (orderIds.length > 1) {
			return Promise.reject(new BlError('orderIds included more than one id').store('orderIds', orderIds));
		}
		
		let orderId = orderIds[0]; //there should only be one order per request;
		
		return this.orderStorage.get(orderId).then(order => {
			return this.validateOrder(order).then((validatedOrder: Order) => {
				return [order];
			});
		}).catch((blError: BlError) => {
			return Promise.reject(blError);
		});
	};
	
	private validateOrder(order: Order): Promise<Order> {
		return new Promise((resolve, reject) => {
			this.orderValidator.validate(order).then(() => {
				if (order.placed) {
					return reject(new BlError('order.placed is set to true on post of order'));
				}
				
				resolve(order);
			}).catch((blError: BlError) => {
				return reject(blError);
			});
		});
	}
}