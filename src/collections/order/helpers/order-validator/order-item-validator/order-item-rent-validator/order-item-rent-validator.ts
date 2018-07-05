
import {Branch, OrderItem, Item, BlError, Order} from '@wizardcoder/bl-model';
import {isNullOrUndefined} from "util";
import {PriceService} from "../../../../../../price/price.service";
import {BlDocumentStorage} from "../../../../../../storage/blDocumentStorage";
import {orderSchema} from "../../../../order.schema";
import {OrderItemRentPeriodValidator} from "./order-item-rent-period-validator/order-item-rent-period-validator";

export class OrderItemRentValidator {
	private priceService: PriceService;
	private orderItemRentPeriodValidator: OrderItemRentPeriodValidator;
	
	constructor(private _orderStorage?: BlDocumentStorage<Order>, ) {
		this.priceService = new PriceService({roundDown: true});
		this._orderStorage = (_orderStorage) ? _orderStorage : new BlDocumentStorage('orders', orderSchema);
		this.orderItemRentPeriodValidator = new OrderItemRentPeriodValidator();
	}
	
	public async validate(branch: Branch, orderItem: OrderItem, item: Item): Promise<boolean> {
		console.log('the order item', orderItem);
		try {
			await this.validateOrderItemInfoFields(orderItem);
			await this.orderItemRentPeriodValidator.validate(orderItem, branch.paymentInfo, item.price);
			return Promise.resolve(true);
		} catch (e) {
			if (e instanceof BlError) {
				return Promise.reject(e);
			}
			return Promise.reject(new BlError('unkown error, could not validate orderItem type rent').store('error', e));
		}
	}

	private validateOrderItemInfoFields(orderItem: OrderItem): boolean {
		if (isNullOrUndefined(orderItem.info)) {
			throw new BlError('orderItem.info is not set when orderItem.type is "rent"');
		}
		return true;
	}
}