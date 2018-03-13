import {BlError, Item, OrderItem} from "bl-model";

export class PriceValidatorCancelBuy {
	
	constructor() {
	
	}
	
	public validateOrderItem(orderItem: OrderItem, item: Item): boolean {
		if (orderItem.type != 'cancel-buy') throw new BlError('orderItem.type is not "cancel-buy", it was "' + orderItem.type + '"');
		if (!orderItem.lastOrderItem) throw new BlError('orderItem.lastOrderItem is not defined');
		if (orderItem.lastOrderItem.type !== 'buy') throw new BlError('orderItem.lastOrderItem.type is not "buy"');
		
		const calculatedPrice = this.calculatePrice(orderItem.lastOrderItem.amount, orderItem.discount) + orderItem.amount;
		if (calculatedPrice != 0) throw new BlError('calculation of orderItem.amount is not correct, was "' + calculatedPrice + '", but should be 0');
		return true;
	}
	
	private calculatePrice(price: number, discount?: number): number {
		return (discount) ? price + discount : price;
	}
}