
import {BlError, Branch, CustomerItem, Item, Order, OrderItem} from "bl-model";

export class PriceValidator {
	private precision: number;
	
	constructor() {
		this.precision = 2;
	}
	
	public validateOrderItem(orderItem: OrderItem, customerItem: CustomerItem, item: Item, branch: Branch): boolean {
		switch (orderItem.type) {
			case 'buy':
				this.validateOrderItemTypeBuy(orderItem, item);
				break;
			case 'sell':
				this.validateOrderItemTypeSell(orderItem, item);
				break;
		}
		return true;
	}
	
	private validateOrderItemTypeSell(orderItem: OrderItem, item: Item): boolean {
		let calculatedValue = this.calculateOrderItemPrice(item.sellPrice, orderItem.discount) + orderItem.amount;
		if (calculatedValue != 0) throw new BlError('orderItem.amount is not correct, was "' + calculatedValue +'", but should be 0');
		return true;
	}
	
	private validateOrderItemTypeBuy(orderItem: OrderItem, item: Item): boolean {
		let calculatedPrice = this.calculateOrderItemPrice(item.price, orderItem.discount);
		if (orderItem.amount != calculatedPrice) throw new BlError('orderItem.amount is not correct, it was "' + orderItem.amount + '", but should be "' + calculatedPrice + '"');
		return true;
	}
	
	
	private calculateOrderItemPrice(price: number, discount?: number) {
		return this.toFixed((discount) ? price + discount : price);
	}
	
	private toFixed(num: number): number {
		const power = Math.pow(10, this.precision || 0);
		return (Math.round(num * power) / power);
	}
}