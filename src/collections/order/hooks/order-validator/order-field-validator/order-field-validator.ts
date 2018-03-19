
import {Order, OrderItem, BlError} from 'bl-model';
import {isNullOrUndefined, isNumber} from "util";

export class OrderFieldValidator {
	
	constructor() {
	
	}
	
	validate(order: Order): Promise<boolean> {
			try {
				this.validateOrderFields(order);
				
				for (let orderItem of order.orderItems) {
					this.validateOrderItemFields(orderItem);
				}
			} catch (e) {
				if (e instanceof BlError) {
					return Promise.reject(e);
				}
				return Promise.reject(new BlError('unknown error, orderItem could not be validated').store('error', e));
			}
	}
	
	private validateOrderFields(order: Order): boolean {
		if (isNullOrUndefined(order.orderItems) || order.orderItems.length <= 0) {
			throw new BlError('order.orderItems is empty or undefined');
		}
		return true;
	}
	
	private validateOrderItemFields(orderItem: OrderItem): boolean {
		if (!orderItem.item) {
			throw new BlError('orderItem.item is not defined');
		}
		
		if (!orderItem.title) {
			throw new BlError('orderItem.title is not defined');
		}
		
		if (!isNumber(orderItem.amount)) {
			throw new BlError('orderItem.amount is not defined');
		}
		
		if (!isNumber(orderItem.unitPrice)) {
			throw new BlError('orderItem.unitPrice is not defined');
		}
		
		if (!isNumber(orderItem.taxAmount)) {
			throw new BlError('orderItem.taxAmount is not defined');
		}
		
		if (!isNumber(orderItem.taxRate)) {
			throw new BlError('orderItem.taxRate is not defined');
		}
		
		if (isNullOrUndefined(orderItem.type)) {
			throw new BlError('orderItem.type is not defined');
		}
		
		return true;
	}
}