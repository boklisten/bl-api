import {BlError, CustomerItem, OrderItem} from "bl-model";

export class PriceValidatorCancelRent {
	
	constructor() {
	
	}
	
	public validateOrderItem(orderItem: OrderItem, customerItem: CustomerItem): boolean {
		if (orderItem.type != 'cancel-rent') throw new BlError('orderItem.type is not equal to "cancel-rent", it was "' + orderItem.type + '"');
		if (!orderItem.customerItem) throw new BlError('orderItem.customerItem is not defined');
		if (customerItem.returned) throw new BlError('customerItem.returned = true when trying to cancel-rent');
		if (customerItem.deadlineExtends && customerItem.deadlineExtends.length > 0) throw new BlError('customerItem.deadlineExtends is not empty when trying to cancel-rent');
		
		const calculatedPrice = this.calculatePrice(customerItem.totalAmount, orderItem.discount);
		if ((calculatedPrice + orderItem.amount) != 0) throw new BlError('orderItem.amount is not correct, it was "' + calculatedPrice + '", but should be 0');
		return true;
	}
	
	private calculatePrice(price: number, discount?: number) {
		return (discount) ? price + discount : price;
	}
}