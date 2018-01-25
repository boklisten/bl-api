
import {BlError, Branch, OrderItem} from "bl-model";

export class BranchValidator {
	
	constructor() {
	
	}
	
	public validateBranchInOrderItem(branch: Branch, orderItem: OrderItem): boolean {
		if (!branch.active) throw new BlError('branch.active is false and can not be used');
		
		switch (orderItem.type) {
			case 'rent':
				this.validateOrderItemTypeRent(branch, orderItem);
				break;
		}
		return true;
	}
	
	private validateOrderItemTypeRent(branch: Branch, orderItem: OrderItem): boolean {
		if (branch.payment.branchResponsible && orderItem.amount > 0) throw new BlError('orderItem.amount is over 0 when branch.payment.branchResponsible is true');
		return true;
	}
}