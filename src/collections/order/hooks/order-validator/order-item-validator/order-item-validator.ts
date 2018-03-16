

import {Order, OrderItem, BlError} from 'bl-model';
import {isNullOrUndefined, isNumber} from "util";
import {OrderItemFieldValidator} from "./order-item-field-validator/order-item-field-validator";

export class OrderItemValidator {
	private orderItemFieldValidator: OrderItemFieldValidator;
	
	constructor(orderItemFieldValidator?: OrderItemFieldValidator) {
		this.orderItemFieldValidator = (orderItemFieldValidator) ? orderItemFieldValidator : new OrderItemFieldValidator();
	}
	
	
	public async validate(order: Order): Promise<boolean> {
	
		try {
			await this.orderItemFieldValidator.validate(order);
			this.validateAmount(order);
		} catch (e) {
			if (e instanceof BlError) {
				return Promise.reject(e);
			}
			return Promise.reject(new BlError('unknown error, orderItem could not be validated').store('error', e));
		}
	}
	
	private validateAmount(order: Order): boolean {
		let totAmount = 0;
		
		for (let orderItem of order.orderItems) {
			totAmount += orderItem.amount;
		}
		
		if (totAmount !== order.amount) {
			throw new BlError(`order.amount is "${order.amount}" but total of orderItems amount is "${totAmount}"`)
		}
		
		return true
	}
}