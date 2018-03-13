
import {BlError, CustomerItem, OrderItem} from "bl-model";
import * as moment from 'moment';
import {APP_CONFIG} from "../../../../../application-config";

export class CustomerItemValidator {
	
	constructor() {
	
	}
	
	public validateWithOrderItems(orderItems: OrderItem[], customerItems: CustomerItem[]): boolean {
		for (let orderItem of orderItems) {
			let cItem = customerItems.find(customerItem => {return orderItem.customerItem === customerItem.id});
			
			switch (orderItem.type) {
				case 'rent':
					this.validateOrderItemTypeRent(orderItem, cItem);
					break;
				case 'buy':
					this.validateOrderItemTypeBuy(orderItem);
					break;
				case 'sell':
					this.validateOrderItemTypeSell(orderItem);
					break;
				case 'cancel-rent':
					this.validateOrderItemTypeCancelRent(orderItem, cItem);
					break;
				case 'buyout':
					this.validateOrderItemTypeBuyOut(orderItem, cItem);
					break;
				default:
					throw new BlError('orderItem.type is not a valid type, it was "' + orderItem.type + '"');
			}
		}
		return true;
	}
	
	private validateOrderItemTypeBuyOut(orderItem: OrderItem, customerItem: CustomerItem): boolean {
		if (!orderItem.customerItem) throw new BlError('orderItem.customerItem is not defined');
		return true;
	}
	
	private validateOrderItemTypeSell(orderItem: OrderItem): boolean {
		if (orderItem.customerItem) throw new BlError('orderItem.customerItem is defined but the orderItem.type is cancel');
		return true;
	}
	
	private validateOrderItemTypeRent(orderItem: OrderItem, customerItem: CustomerItem): boolean {
		if (orderItem.item !== customerItem.item) throw new BlError('orderItem.item is not equal to customerItem.item');
		if (customerItem && orderItem.amount !== customerItem.totalAmount) throw new BlError('orderItem.amount is not equal to customerItem.totalAmount');
		if (!customerItem.user || !customerItem.user.id) throw new BlError('customerItem.user is undefined');
		if (customerItem.returned) throw new BlError('customerItem.returned is true when orderItem.type is of type "rent"');
		return true;
	}
	
	private validateOrderItemTypeBuy(orderItem: OrderItem): boolean {
		if (orderItem.customerItem) throw new BlError('orderItem.customerItem is defined when type is "buy"');
		return true;
	}
	
	private validateOrderItemTypeCancelRent(orderItem: OrderItem, customerItem: CustomerItem): boolean {
		if (customerItem) {
			if (customerItem.handout) {
				if (customerItem.returned) throw new BlError('customerItem.returned can not be true when orderItem.type is cancel');
				if (!customerItem.handoutTime) throw new BlError('customerItem.handoutTime is not defined when customerItem.handout is true');
				if (moment().isAfter(moment(customerItem.handoutTime).day(APP_CONFIG.date.cancelDays))) throw new BlError('customerItem.handoutTime is longer ago than return policy');
				if (customerItem.totalAmount != orderItem.amount) throw new BlError('orderItem.amount is not equal to customerItem.totalAmount');
			}
		}
		return true;
	}
}