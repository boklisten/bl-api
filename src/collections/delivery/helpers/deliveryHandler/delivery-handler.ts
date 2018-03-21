

import {Delivery, Order, BlError, AccessToken, Item, DeliveryInfoBring} from 'bl-model';
import {BlDocumentStorage} from "../../../../storage/blDocumentStorage";
import {orderSchema} from "../../../order/order.schema";
import {itemSchema} from "../../../item/item.schema";
import {BringDeliveryService} from "../deliveryBring/bringDelivery.service";
import {deliverySchema} from "../../../../../dist/collections/delivery/delivery.schema";

export class DeliveryHandler {
	private orderStorage: BlDocumentStorage<Order>;
	private itemStorage: BlDocumentStorage<Item>;
	private bringDeliveryService: BringDeliveryService;
	private deliveryStorage?: BlDocumentStorage<Delivery>;
	
	constructor(orderStorage?: BlDocumentStorage<Order>, itemStorage?: BlDocumentStorage<Item>, deliveryStorage?: BlDocumentStorage<Delivery>, bringDeliveryService?: BringDeliveryService) {
		this.orderStorage = (orderStorage) ? orderStorage : new BlDocumentStorage('orders', orderSchema);
		this.itemStorage = (itemStorage) ? itemStorage : new BlDocumentStorage('items', itemSchema);
		this.bringDeliveryService = (bringDeliveryService) ? bringDeliveryService : new BringDeliveryService();
		this.deliveryStorage = (deliveryStorage) ? deliveryStorage : new BlDocumentStorage('deliveries', deliverySchema);
	}
	
	public updateOrderBasedOnMethod(delivery: Delivery, order: Order, accessToken?: AccessToken): Promise<Delivery> {
		
		switch (delivery.method) {
			case "branch":
				return this.updateOrderWithDeliveryMethodBranch(delivery, order, accessToken);
			case "bring":
				return this.updateOrderWithDeliveryMethodBring(delivery, order, accessToken);
		}
	}
	
	private updateOrderWithDeliveryMethodBranch(delivery: Delivery, order: Order, accessToken: AccessToken): Promise<Delivery> {
		return this.orderStorage.update(order.id, {delivery: delivery.id}, {id: accessToken.sub, permission: accessToken.permission}).then((updatedOrder: Order) => {
			return Promise.resolve(delivery);
		}).catch((blError: BlError) => {
			return Promise.reject(blError);
		});
	}
	
	private updateOrderWithDeliveryMethodBring(delivery: Delivery, order: Order, accessToken: AccessToken): Promise<Delivery> {
		return new Promise((resolve, reject) => {
		    this.fetchItems(order).then((items: Item[]) => {
		    	this.getBringDeliveryInfoAndUpdateDelivery(delivery, items).then((updatedDelivery: Delivery) => {
		    		this.orderStorage.update(order.id, {delivery: updatedDelivery.id}, {id: accessToken.sub, permission: accessToken.permission}).then((updatedOrder: Order) => {
		    			return resolve(updatedDelivery);
					}).catch((blError: BlError) => {
		   				return reject(blError);
					});
				});
			});
		});
	}
	
	private fetchItems(order: Order): Promise<Item[]> {
		return new Promise((resolve, reject) => {
			let itemIds: string[] = [];
			
			for (let orderItem of order.orderItems) {
				itemIds.push(orderItem.item);
			}
			
		    this.itemStorage.getMany(itemIds).then((items: Item[]) => {
				resolve(items);
			}).catch((blError: BlError) => {
				reject(blError);
			});
		});
	}
	
	private getBringDeliveryInfoAndUpdateDelivery(delivery: Delivery, items: Item[]): Promise<Delivery> {
		return new Promise((resolve, reject) => {
		    this.bringDeliveryService.getDeliveryInfoBring(delivery.info['from'], delivery.info['to'], items).then((deliveryInfoBring: DeliveryInfoBring) => {
		    	this.deliveryStorage.update(delivery.id, {info: deliveryInfoBring}, {id: 'SYSTEM', permission: "admin"}).then((updatedDelivery: Delivery) => {
		    		resolve(updatedDelivery);
				}).catch((blError: BlError) => {
		    		reject(blError);
				})
			}).catch((blError) => {
		    	reject(blError);
			})
		});
	}
}