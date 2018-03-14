

import {Hook} from "../../../hook/hook";
import {BlError, Delivery, DeliveryInfoBring, Item, Order} from "bl-model";
import {BlDocumentStorage} from "../../../storage/blDocumentStorage";
import {orderSchema} from "../../order/order.schema";
import {itemSchema} from "../../item/item.schema";
import {BringDeliveryService} from "../helpers/bring/bringDelivery.service";
import {deliverySchema} from "../delivery.schema";

export class DeliveryPostHook extends Hook {
	
	private orderStorage: BlDocumentStorage<Order>;
	private deliveryStorage: BlDocumentStorage<Delivery>;
	private itemStorage: BlDocumentStorage<Item>;
	private bringDeliveryService: BringDeliveryService;
	
	constructor(deliveryStorage?: BlDocumentStorage<Delivery>, orderStorage?: BlDocumentStorage<Order>,
				itemStorage?: BlDocumentStorage<Item>, bringDeliveryService?: BringDeliveryService) {
		super();
		this.deliveryStorage = (deliveryStorage) ? deliveryStorage : new BlDocumentStorage('deliveries', deliverySchema);
		this.orderStorage = (orderStorage) ? orderStorage : new BlDocumentStorage('orders', orderSchema);
		this.itemStorage = (itemStorage) ? itemStorage : new BlDocumentStorage('items', itemSchema);
		this.bringDeliveryService = (bringDeliveryService) ? bringDeliveryService : new BringDeliveryService();
	}
	
	public after(deliveryIds: string[]): Promise<boolean | Delivery[]> {
		if (!deliveryIds || deliveryIds.length <= 0) {
			return Promise.reject(new BlError('deliveryIds is empty or undefined'));
		}
		
		return new Promise((resolve, reject) => {
			
			
			for (let deliveryId of deliveryIds) {
				this.deliveryStorage.get(deliveryId)
					.then(delivery  => this.orderStorage.get(delivery.order))
					.then(order => {
						let itemIds = [];
						
						for (let orderItem of order.orderItems) {
							itemIds.push(orderItem.item);
						}
						
						this.itemStorage.getMany(itemIds).then((items: Item[]) => {
							this.getBringDeliveryInfo(deliveryId, items).then((delivery: Delivery) => {
								resolve([delivery]);
							}).catch((blError: BlError) => {
								reject(new BlError('could not get delivery info for bring').add(blError));
							})
						}).catch((blError: BlError) => {
							reject(new BlError('not found').code(702).add(blError));
						})
					}).catch((blError: BlError) => {
						return reject(new BlError(`not found`).code(702).add(blError));
					});
				
			}
		});
		
	}
	
	private getBringDeliveryInfo(deliveryId: string, items: Item[]): Promise<Delivery> {
		return new Promise((resolve, reject) => {
		    this.bringDeliveryService.getDeliveryInfoBring("0560", "7070", items).then((deliveryInfoBring: DeliveryInfoBring) => {
		    	this.deliveryStorage.update(deliveryId, {info: deliveryInfoBring}, {id: 'SYSTEM', permission: "admin"}).then((delivery: Delivery) => {
		    		resolve(delivery);
				}).catch((blError: BlError) => {
		    		reject(blError);
				})
			}).catch((blError) => {
		    	reject(blError);
			})
		});
	}
}