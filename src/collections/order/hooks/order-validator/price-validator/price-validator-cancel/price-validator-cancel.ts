import {BlError, CustomerItem, Item, OrderItem} from "bl-model";
import {PriceValidatorCancelRent} from "./price-validator-cancel-rent/price-validator-cancel-rent";
import {PriceValidatorCancelBuy} from "./price-validator-cancel-buy/price-validator-cancel-buy";

export class PriceValidatorCancel {
	private priceValidatorCancelRent: PriceValidatorCancelRent;
	private priceValidatorCancelBuy: PriceValidatorCancelBuy;
	//private priceValidatorCancelExtend: PriceValidato
	
	constructor() {
		this.priceValidatorCancelRent = new PriceValidatorCancelRent();
		this.priceValidatorCancelBuy = new PriceValidatorCancelBuy();
	
	}
	
	public validateOrderItem(orderItem: OrderItem, customerItem: CustomerItem, item: Item): boolean {
		switch (orderItem.type) {
			case 'cancel-rent':
				this.priceValidatorCancelRent.validateOrderItem(orderItem, customerItem);
				break;
			case 'cancel-extend':
				break;
			case 'cancel-buy':
				this.priceValidatorCancelBuy.validateOrderItem(orderItem, item);
				break;
			default:
				throw new BlError('orderItem.type is not in the cancel category, it was "' + orderItem.type + '"');
		}
		return true;
		
	}
}