
import {Delivery, Order, BlError, AccessToken} from 'bl-model';
import {Hook} from "../../../hook/hook";
import {DeliveryValidator} from "../helpers/deliveryValidator/delivery-validator";
import {BlDocumentStorage} from "../../../storage/blDocumentStorage";
import {deliverySchema} from "../../../../dist/collections/delivery/delivery.schema";
import {isNullOrUndefined} from "util";
import {isEmpty} from "typescript-library-bundler/dist";
import {orderSchema} from "../../order/order.schema";

export class DeliveryPatchHook extends Hook {
	
	private deliveryValidator?: DeliveryValidator;
	private deliveryStorage: BlDocumentStorage<Delivery>;
	private orderStorage: BlDocumentStorage<Order>;
	
	constructor(deliveryValidator?: DeliveryValidator, deliveryStorage?: BlDocumentStorage<Delivery>, orderStorage?: BlDocumentStorage<Order>) {
		super();
		this.deliveryValidator = (deliveryValidator) ? deliveryValidator : new DeliveryValidator();
		this.deliveryStorage = (deliveryStorage) ? deliveryStorage : new BlDocumentStorage<Delivery>('deliveries', deliverySchema);
		this.orderStorage = (orderStorage) ? orderStorage : new BlDocumentStorage<Order>('orders', orderSchema);
	}
	
	before(body: any, accessToken?: AccessToken, id?: string): Promise<boolean> {
		
		if (isEmpty(body) || isNullOrUndefined(body)) {
			return Promise.reject(new BlError('body is undefined'));
		}
		
		if (isNullOrUndefined(id)) {
			return Promise.reject(new BlError('id is undefined'));
		}
		
		if (isEmpty(accessToken) || isNullOrUndefined(accessToken)) {
			return Promise.reject(new BlError('accessToken is undefined'));
		}
		
		return this.tryToValidatePatch(body, accessToken, id).then(() => {
			return true;
		}).catch((blError: BlError) => {
			return Promise.reject(blError);
		})
	}
	
	private tryToValidatePatch(body: any, accessToken: AccessToken, id: string): Promise<boolean> {
		return new Promise((resolve, reject) => {
			this.deliveryStorage.get(id).then((delivery: Delivery) => {
				if (body['info']) {
					delivery.info = body['info'];
				}
				if (body['amount']) {
					delivery.amount = body['amount'];
				}
				if (body['order']) {
					delivery.order = body['order'];
				}
				if (body['method']) {
					delivery.method = body['method'];
				}
				
				this.orderStorage.get(delivery.order).then((order: Order) => {
					this.deliveryValidator.validate(delivery, order).then(() => {
						return resolve(true);
					}).catch((blError: BlError) => {
						return reject(new BlError('patched delivery could not be validated').add(blError).store('delivery', delivery));
					});
				}).catch((blError: BlError) => {
					return reject(new BlError(`order "${delivery.order}" not found`).add(blError));
				})
			}).catch((blError: BlError) => {
				return reject(new BlError(`delivery "${id}" not found`).add(blError));
			})
		});
		
	}
	
}