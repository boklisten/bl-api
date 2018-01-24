

import {BlError, Order, OrderItem, OrderPayment} from "bl-model";

export class PriceValidatorOrder {
	
	constructor() {
	
	}
	
	public validate(order: Order): boolean {
		try {
			this.validateOrderItemsAmount(order.amount, order.orderItems);
			this.validatePaymentsAmount(order.amount, order.payments);
		} catch (err) {
			if (err instanceof BlError) throw err;
			throw new BlError('could not validate price of order');
		}
		return true;
	}
	
	private validateOrderItemsAmount(amount: number, orderItems: OrderItem[]): boolean {
		let sum = 0;
		for (let orderItem of orderItems) {
			sum += orderItem.amount;
		}
		
		if (sum != amount) throw new BlError('orderItems amount is not equal to order.amount');
		return true;
	}
	
	private validatePaymentsAmount(amount: number, payments: OrderPayment[]): boolean {
		let sum = 0;
		for (let payment of payments) {
			sum += payment.amount;
		}
		
		if (sum != amount) throw new BlError('payments total amount is not equal to order.amount');
		return true;
	}
}