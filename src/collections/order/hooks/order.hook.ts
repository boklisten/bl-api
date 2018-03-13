

import {Hook} from "../../../hook/hook";
import {BlError, Order, UserDetail} from "bl-model";
import {SEDocument} from "../../../db/model/se.document";
import {OrderValidator} from "./order-validator/order-validator";
import {UserDetailSchema} from "../../../config/schema/user/user-detail.schema";
import {SESchema} from "../../../config/schema/se.schema";
import {BlDocumentStorage} from "../../../storage/blDocumentStorage";
import {userDetailSchema} from "../../user-detail/user-detail.schema";

export class OrderHook extends Hook {
	private orderValidator: OrderValidator;
	private userDetailStorage: BlDocumentStorage<UserDetail>;
	
	constructor() {
		super();
		this.orderValidator = new OrderValidator();
		this.userDetailStorage = new BlDocumentStorage('userdetails', userDetailSchema);
	}

	public run(docs: SEDocument[]): Promise<boolean> {
		return new Promise((resolve, reject) => {
			if (!docs || docs.length <= 0) return reject(new BlError('no documents provided').code(701));
			
			this.validateDocs(docs).then((orders: Order[]) => {
				this.updateUserDetails(orders[0].customer, orders).then(() => {
					resolve(true);
				}).catch((updateErr: BlError) => {
					reject(new BlError('could not update userDetails after order creation').add(updateErr));
				});
			}).catch((err: BlError) => {
				return reject(new BlError('there was an error with the order data provided').code(701).add(err));
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
				reject(new BlError('could not get userDetails based on userId when trying to update userDetails').add(getByIdError));
			})
		});
	}
	
	private validateDocs(docs: SEDocument[]): Promise<Order[]> {
		return new Promise((resolve, reject) => {
			
			try {
				this.checkForMultiple(docs);
			} catch (err) {
				return reject(err);
			}
			
			let validatedOrders: Promise<Order>[] = [];
			
			for (let doc of docs) {
				validatedOrders.push(this.validateData(doc));
			}
			
			Promise.all(validatedOrders).then((validatedOrders: Order[]) => {
				resolve(validatedOrders);
			}).catch((err: BlError) => {
				reject(new BlError('the orders are not valid').code(701).add(err));
			})
		});
	}
	
	private validateData(doc: SEDocument): Promise<Order> {
		return new Promise((resolve, reject) => {
			try {
				this.validateDocument(doc);
			} catch (err) {
				reject(new BlError('could not validate document'));
			}
			
			const order = doc.data as Order;
			
			
			this.orderValidator.validate(order).then(() => {
				resolve(order);
			}).catch((orderValidationError: BlError) => {
				reject(new BlError('order could not be validated').code(701).add(orderValidationError));
			});
		});
	}
	
	private checkForMultiple(docs: SEDocument[]): boolean {
		for (let i = 0; i < docs.length; i++) {
			for (let j = 0; j < docs.length; j++) {
				if (i != j) {
					if (docs[i].data === docs[j].data) throw new BlError('some of the docs provided are the same');
				}
			}
		}
		
		return true;
	}
	
	private validateDocument(doc: SEDocument): boolean {
		if (doc.documentName !== 'order') throw new BlError('document is not of valid type "order", it was "' + doc.documentName);
		if (!doc.data || this.isEmpty(doc.data)) throw new BlError('no data provided on document');
		return true;
	}
	
	private isEmpty(obj: any) {
		for (let x in obj) {
			return false;
		}
		return true;
	}
}