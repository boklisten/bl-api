import {BlError, CustomerItem, OrderItem} from "bl-model";

export class PriceValidatorCancel {
	
	constructor() {
	
	}
	
	public validateOrderItem(orderItem: OrderItem, customerItem: CustomerItem): boolean {
		switch (orderItem.type) {
			case 'cancel-rent':
				break;
			case 'cancel-extend':
				break;
			default:
				throw new BlError('orderItem.type is not in the cancel category, it was "' + orderItem.type + '"');
		}
		return true;
		
	}
}