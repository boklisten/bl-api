


import {Hook} from "../../../hook/hook";
import {AccessToken, BlError, Order, UserDetail, Delivery} from '@wizardcoder/bl-model';
import {isEmpty} from "typescript-library-bundler/dist";
import {isNullOrUndefined} from "util";
import {BlDocumentStorage} from "../../../storage/blDocumentStorage";
import {userDetailSchema} from "../../user-detail/user-detail.schema";
import {OrderValidator} from "../helpers/order-validator/order-validator";
import {orderSchema} from "../order.schema";
import {OrderPlacedHandler} from "../helpers/order-placed-handler/order-placed-handler";

export class OrderPatchHook extends Hook {
	
	private userDetailStorage: BlDocumentStorage<UserDetail>;
	private orderValidator: OrderValidator;
	private orderStorage: BlDocumentStorage<Order>;
	private orderPlacedHandler: OrderPlacedHandler;
	
	constructor(userDetailStorage?: BlDocumentStorage<UserDetail>, orderStorage?: BlDocumentStorage<Order>, orderValidator?: OrderValidator, orderPlacedHandler?: OrderPlacedHandler) {
		super();
		this.userDetailStorage = (userDetailStorage) ? userDetailStorage : new BlDocumentStorage<UserDetail>('userdetails', userDetailSchema);
		this.orderStorage = (orderStorage) ? orderStorage : new BlDocumentStorage('orders', orderSchema);
		this.orderValidator = (orderValidator) ? orderValidator : new OrderValidator();
		this.orderPlacedHandler = (orderPlacedHandler) ? orderPlacedHandler : new OrderPlacedHandler();
	}
	
	before(body: any, accessToken: AccessToken, id: string): Promise<boolean> {
		if (isEmpty(body) || isNullOrUndefined(body)) {
			return Promise.reject(new BlError('body not defined'));
		}
		
		if (isEmpty(accessToken) || isNullOrUndefined(accessToken)) {
			return Promise.reject(new BlError('accessToken not defined'));
		}
		
		if (isNullOrUndefined(id)) {
			return Promise.reject(new BlError('id not defined'));
		}
		
		return Promise.resolve(true);
	}
	
	after(orderIds: string[], accessToken: AccessToken): Promise<boolean | Order[]> {
		if (orderIds.length > 1) {
			return Promise.reject(new BlError('can only patch one order at a time'));
		}
		
		if (isEmpty(accessToken) || isNullOrUndefined(accessToken)) {
			return Promise.reject(new BlError('accessToken not defined'));
		}
		return new Promise((resolve, reject) => {
			this.orderStorage.get(orderIds[0]).then((order: Order) => {
				if (order.placed) {
					this.orderPlacedHandler.placeOrder(order, accessToken).then((placedOrder) => {
						resolve([placedOrder]);
					}).catch((orderPlacedError: BlError) => {
						reject(new BlError('order could not be placed').add(orderPlacedError));
					})
				} else {
					this.orderValidator.validate(order).then(() => {
						resolve(true);
					}).catch((validationError: BlError) => {
						if (order.placed) {
							this.orderStorage.update(order.id, {placed: false}, {
								id: accessToken.sub,
								permission: accessToken.permission
							}).then(() => {
								return reject(new BlError('validation of patch of order failed, order.placed is set to false').add(validationError))
							}).catch((updateError: BlError) => {
								return reject(new BlError('could not set order.placed to false when order validation failed').add(updateError).add(validationError))
							});
						} else {
							return reject(new BlError('patch of order could not be validated').add(validationError));
						}
					});
				}
			}).catch((blError: BlError) => {
				return reject(new BlError(`order "${orderIds[0]}" not found`).add(blError));
			});
		});
	}
	
	private updatePaymentOnPlacedOrder(order: Order) {
	
	}
	
	private updateUserDetailsWhenOrderIsPlaced(accessToken: AccessToken, order: Order): Promise<boolean> {
		return this.userDetailStorage.get(accessToken.details).then((userDetail: UserDetail) => {
			
			let orderIds = (userDetail.orders) ? userDetail.orders : [];
			
			for (let orderId of orderIds) {
				if (order.id === orderId) {
					return Promise.reject(new BlError(`order.id "${order.id}" is already in userDetail.orders`));
				}
			}
			
			orderIds.push(order.id);
			
			return this.userDetailStorage.update(userDetail.id,{orders: orderIds}, {id: accessToken.sub, permission: accessToken.permission}).then(() => {
				return true;
			}, (userDetailPatchError: BlError) => {
				return Promise.reject(new BlError('could not update userDetails with the new orders array').add(userDetailPatchError));
			});
			
		}, (getUserDetailError: BlError) => {
			return Promise.reject(new BlError(`could not get userDetail "${accessToken.details}" when trying to update userDetail`).add(getUserDetailError));
		}).catch((blError: BlError) => {
			return Promise.reject(blError)
		});
	}
}