

import {Order, BlError} from 'bl-model';
import {OrderItemFieldValidator} from "../order-item-field-validator/order-item-field-validator";

export class OrderItemPriceValidator {
	private orderItemFieldValidator: OrderItemFieldValidator;
	
	constructor(orderItemFieldValidator?: OrderItemFieldValidator) {
		this.orderItemFieldValidator = (orderItemFieldValidator) ? orderItemFieldValidator : new OrderItemFieldValidator();
	}
	
	public async validate(order: Order): Promise<boolean> {
		try {
			await this.orderItemFieldValidator.validate(order);
		} catch (e) {
			if (e instanceof BlError) {
				return Promise.reject(e);
			}
			
			return Promise.reject(new BlError('unkown error, could not validate price of orderItems').store('error', e));
		}
		
		return Promise.resolve(true);
	}
}