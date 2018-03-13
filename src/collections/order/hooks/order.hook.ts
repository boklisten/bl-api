

import {Hook} from "../../../hook/hook";
import {BlError, Order, UserDetail} from "bl-model";
import {OrderValidator} from "./order-validator/order-validator";
import {BlDocumentStorage} from "../../../storage/blDocumentStorage";
import {userDetailSchema} from "../../user-detail/user-detail.schema";
import {orderSchema} from "../order.schema";

export class OrderHook extends Hook {
	private orderValidator: OrderValidator;
	private userDetailStorage: BlDocumentStorage<UserDetail>;
	private orderStorage: BlDocumentStorage<Order>;
	
	constructor() {
		super();
		this.orderValidator = new OrderValidator();
		this.userDetailStorage = new BlDocumentStorage('userdetails', userDetailSchema);
		this.orderStorage = new BlDocumentStorage('orders', orderSchema);
	}

	public after(orderIds: string[]): Promise<boolean | Order[]> {
		return new Promise((resolve, reject) => {
			if (!orderIds || orderIds.length <= 0) return reject(new BlError('no documents provided').code(701));
			
			this.orderStorage.getMany(orderIds).then((orders: Order[]) => {
				this.validateDocs(orders).then((validatedOrders: Order[]) => {
					this.updateUserDetails(validatedOrders[0].customer, validatedOrders).then(() => {
						resolve(validatedOrders);
					}).catch((updateErr: BlError) => {
						reject(new BlError(`could not update userDetail "${validatedOrders[0].customer}" after order creation`).add(updateErr));
					});
				}).catch((err: BlError) => {
					return reject(new BlError('there was an error with the order data provided').code(701).add(err));
				})
			}).catch((blError: BlError) => {
				return reject(new BlError('could not find the provided orderIds').store('orderIds', orderIds).add(blError));
			})
		});
	}
	
	private updateUserDetails(userDetailId: string, orders: Order[]): Promise<boolean> {
		return new Promise((resolve, reject) => {
		    let userDetailsPromiseArr: Promise<boolean>[] = [];
		    let orderIds: string[] = [];
		    
		    for (let order of orders) {
		    	orderIds.push(order.id);
			}
			
			userDetailsPromiseArr.push(this.patchUserDetails(userDetailId, orderIds));
		    
		    Promise.all(userDetailsPromiseArr).then((updated) => {
		    	resolve(true);
			}).catch((updateError: BlError) => {
		    	reject(new BlError('could not update userDetails').add(updateError));
			})
		});
	}
	
	private patchUserDetails(userDetailId: string, orderIds: string[]): Promise<boolean> {
		return new Promise((resolve, reject) => {
			this.userDetailStorage.get(userDetailId).then((userDetail: UserDetail) => {
		    		
		    		let orders = (userDetail.orders) ? userDetail.orders : [];
		    		
		    		for (let orderId of orderIds) {
						orders.push(orderId);
					}
		    		
		    		this.userDetailStorage.update(userDetail.id,{orders: orders}, {id: userDetail.user.id, permission: userDetail.user.permission}).then(() => {
		    			resolve(true);
					}).catch((patchError: BlError) => {
		   				reject(new BlError('could not update userDetails with the new orders array').add(patchError));
					});
			}).catch((getByIdError: BlError) => {
				reject(new BlError(`could not get userDetail "${userDetailId}" when trying to update userDetails`).add(getByIdError));
			})
		});
	}
	
	private validateDocs(orders: Order[]): Promise<Order[]> {
		return new Promise((resolve, reject) => {
			
			try {
				this.checkForMultiple(orders);
			} catch (err) {
				return reject(err);
			}
			
			let validatedOrders: Promise<Order>[] = [];
			
			for (let order of orders) {
				validatedOrders.push(this.validateData(order));
			}
			
			Promise.all(validatedOrders).then((validatedOrders: Order[]) => {
				resolve(validatedOrders);
			}).catch((err: BlError) => {
				reject(new BlError('the orders are not valid').code(701).add(err));
			})
		});
	}
	
	private validateData(order: Order): Promise<Order> {
		return new Promise((resolve, reject) => {
			try {
				this.validateDocument(order);
			} catch (err) {
				reject(new BlError('could not validate document'));
			}
			
			this.orderValidator.validate(order).then(() => {
				resolve(order);
			}).catch((orderValidationError: BlError) => {
				reject(new BlError('order could not be validated').code(701).add(orderValidationError));
			});
		});
	}
	
	private checkForMultiple(orders: Order[]): boolean {
		for (let i = 0; i < orders.length; i++) {
			for (let j = 0; j < orders.length; j++) {
				if (i != j) {
					if (orders[i] === orders[j]) throw new BlError('some of the docs provided are the same');
				}
			}
		}
		
		return true;
	}
	
	private validateDocument(order: Order): boolean {
		return true;
	}
}