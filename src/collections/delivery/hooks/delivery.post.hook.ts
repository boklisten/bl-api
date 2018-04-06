

import {Hook} from "../../../hook/hook";
import {BlError, Delivery, DeliveryInfoBring, Item, Order, AccessToken} from "@wizardcoder/bl-model";
import {BlDocumentStorage} from "../../../storage/blDocumentStorage";
import {orderSchema} from "../../order/order.schema";
import {itemSchema} from "../../item/item.schema";
import {BringDeliveryService} from "../helpers/deliveryBring/bringDelivery.service";
import {deliverySchema} from "../delivery.schema";
import {DeliveryValidator} from "../helpers/deliveryValidator/delivery-validator";
import {DeliveryHandler} from "../helpers/deliveryHandler/delivery-handler";

export class DeliveryPostHook extends Hook {
	
	private orderStorage: BlDocumentStorage<Order>;
	private deliveryStorage: BlDocumentStorage<Delivery>;
	private itemStorage: BlDocumentStorage<Item>;
	private bringDeliveryService: BringDeliveryService;
	private deliveryValidator: DeliveryValidator;
	private deliveryHandler: DeliveryHandler;
	
	constructor(deliveryValidator?: DeliveryValidator, deliveryHandler?: DeliveryHandler, deliveryStorage?: BlDocumentStorage<Delivery>, orderStorage?: BlDocumentStorage<Order>,
				itemStorage?: BlDocumentStorage<Item>, bringDeliveryService?: BringDeliveryService) {
		super();
		this.deliveryValidator = (deliveryValidator) ? deliveryValidator : new DeliveryValidator();
		this.deliveryHandler = (deliveryHandler) ? deliveryHandler : new DeliveryHandler();
		
		this.deliveryStorage = (deliveryStorage) ? deliveryStorage : new BlDocumentStorage('deliveries', deliverySchema);
		this.orderStorage = (orderStorage) ? orderStorage : new BlDocumentStorage('orders', orderSchema);
		this.itemStorage = (itemStorage) ? itemStorage : new BlDocumentStorage('items', itemSchema);
		this.bringDeliveryService = (bringDeliveryService) ? bringDeliveryService : new BringDeliveryService();
	}
	
	public after(deliveryIds: string[], accessToken?: AccessToken): Promise<boolean | Delivery[]> {
		if (!deliveryIds || deliveryIds.length <= 0) {
			return Promise.reject(new BlError('deliveryIds is empty or undefined'));
		}
		
		if (deliveryIds.length > 1) {
			return Promise.reject(new BlError('can not add more than one delivery'));
		}
		
		return new Promise((resolve, reject) => {
			this.deliveryStorage.get(deliveryIds[0]).then((delivery: Delivery) => {
				this.orderStorage.get(delivery.order).then((order: Order) => {
					this.deliveryValidator.validate(delivery, order).then(() => {
						
						this.deliveryHandler.updateOrderBasedOnMethod(delivery, order, accessToken).then((updatedDelivery: Delivery) => {
							return resolve([updatedDelivery]);
						}).catch((blError: BlError) => {
							return reject(blError);
						});
						
					}).catch((blError: BlError) => {
						return reject(blError);
					});
				}).catch((blError: BlError) => {
					return reject(blError);
				});
			}).catch((blError: BlError) => {
				return reject(blError);
			})
		
		});
		
	}

}