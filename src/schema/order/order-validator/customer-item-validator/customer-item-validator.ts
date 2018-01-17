
import {EndpointMongodb} from "../../../../endpoint/endpoint.mongodb";
import {BlError, CustomerItem, OrderItem} from "bl-model";

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
			}
		}
		return true;
	}
	
	private validateOrderItemTypeRent(orderItem: OrderItem, customerItem: CustomerItem): boolean {
		if (orderItem.item !== customerItem.item) throw new BlError('orderItem.item is not equal to customerItem.item');
		if (customerItem && orderItem.amount !== customerItem.totalAmount) throw new BlError('orderItem.amount is not equal to customerItem.totalAmount');
		return true;
	
	}
}