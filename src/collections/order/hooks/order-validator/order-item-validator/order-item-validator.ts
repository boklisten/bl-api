

import {Order, OrderItem, BlError} from 'bl-model';
import {isNullOrUndefined, isNumber} from "util";

export class OrderItemValidator {
	
	constructor() {
	
	}
	
	
	public async validate(order: Order): Promise<boolean> {
		
		for (let orderItem of order.orderItems) {
			try {
				this.validateFields(orderItem);
				this.validateAmount(order);
			} catch (e) {
				if (e instanceof BlError) {
					return Promise.reject(e);
				}
				return Promise.reject(new BlError('unknown error, orderItem could not be validated').store('error', e));
			}
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
	
	private validateFields(orderItem: OrderItem): boolean {
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