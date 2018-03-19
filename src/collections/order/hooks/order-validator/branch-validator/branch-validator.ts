
import {BlError, Branch, OrderItem} from "bl-model";

import {Order} from 'bl-model';

export class BranchValidator {
	
	constructor() {
	
	}
	
	public validate(order: Order): Promise<boolean> {
		return Promise.reject('branch validation not implemented');
	}
	
	private validateBranchInOrderItem(branch: Branch, orderItem: OrderItem): boolean {
		if (!branch.active) throw new BlError('branch.active is false and can not be used');
		
		switch (orderItem.type) {
			case 'rent':
				this.validateOrderItemTypeRent(branch, orderItem);
				break;
		}
		return true;
	}
	
	private validateOrderItemTypeRent(branch: Branch, orderItem: OrderItem): boolean {
		return true;
	}
}