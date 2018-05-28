

import {BlError, Item, OrderItem} from "@wizardcoder/bl-model";

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
		return true;
	}
	
	private validateOrderItemTypeSell(item: Item): boolean {
		return true;
	}
	
	
}