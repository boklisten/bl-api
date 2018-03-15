

import {Hook} from "../../../hook/hook";
import {BlError, Order, UserDetail, Payment, Delivery, Branch, Item} from "bl-model";
import {OrderValidator} from "./order-validator/order-validator";
import {BlDocumentStorage} from "../../../storage/blDocumentStorage";
import {userDetailSchema} from "../../user-detail/user-detail.schema";
import {orderSchema} from "../order.schema";
import {OrderHookBefore} from "./order-hook-before";

export class OrderHook extends Hook {
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

	public after(orderIds: string[], userDetailId?: string): Promise<boolean | Order[]> {
		if (!userDetailId || userDetailId.length <= 0) {
			return Promise.reject(new BlError('userId was not specified when trying to process order'))
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
				return this.updateUserDetailsIfOrderIsPlaced(userDetailId, validatedOrder).then(order => {
					return [order];
				});
			});
		}).catch((blError: BlError) => {
			return Promise.reject(blError);
		});
	};
	
	private updateUserDetailsIfOrderIsPlaced(userDetailId: string, order: Order): Promise<Order> {
		if (order.placed) {
			return this.userDetailStorage.get(userDetailId).then((userDetail: UserDetail) => {
				
				let orderIds = (userDetail.orders) ? userDetail.orders : [];
				
				for (let orderId of orderIds) {
					if (order.id === orderId) {
						return Promise.reject(new BlError('the order was already placed'));
					}
				}
				
				orderIds.push(order.id);
				
				return this.userDetailStorage.update(userDetail.id,{orders: orderIds}, {id: userDetail.user.id, permission: userDetail.user.permission}).then(() => {
					return order;
				}, (userDetailPatchError: BlError) => {
					return Promise.reject(new BlError('could not update userDetails with the new orders array').add(userDetailPatchError));
				});
			}, (getUserDetailError: BlError) => {
				return Promise.reject(new BlError(`could not get userDetail "${userDetailId}" when trying to update userDetail`).add(getUserDetailError));
			}).catch((blError: BlError) => {
				return Promise.reject(blError)
			});
		}
		return Promise.resolve(order); //if order is not being placed the order are valid
	}
	
	private validateOrder(order: Order): Promise<Order> {
		return this.orderValidator.validate(order).then(() => {
			return order;
		}).catch((blError: BlError) => {
			return Promise.reject(blError);
		});
	}
}