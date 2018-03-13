

import {BlError, Item, OrderItem} from "bl-model";

export class ItemValidator {
	
	constructor() {
	
	}
	
	public validateItemInOrder(item: Item, orderItem: OrderItem): boolean {
		if (item.id != orderItem.item) {
			throw new BlError('item.id "' + item.id + '" is not equal to orderItem.item "' + orderItem.item + '"');
		}
		if (!item.active) {
			throw new BlError('item.active is false and cannot be in a order');
		}
		
		switch (orderItem.type) {
			case 'rent':
				this.validateOrderItemTypeRent(item);
				break;
			case 'sell':
				this.validateOrderItemTypeSell(item);
				break;
		}
		
		return true;
	
	}
	
	private validateOrderItemTypeRent(item: Item): boolean {
		if (!item.rent) throw new BlError('item.rent is false, but orderItem.type is "rent"');
		return true;
	}
	
	private validateOrderItemTypeSell(item: Item): boolean {
		if (!item.sell) throw new BlError('item.sell is false, but orderItem.type is "sell"');
		return true;
	}
	
	
}