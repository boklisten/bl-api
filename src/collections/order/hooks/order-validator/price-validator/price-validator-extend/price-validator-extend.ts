
import {BlError, Branch, OrderItem} from "bl-model";

export class PriceValidatorExtend {
	constructor() {
	
	}
	
	public validateOrderItem(orderItem: OrderItem, branch: Branch): boolean {
		if (orderItem.type != 'extend') throw new BlError('orderItem.type is not equal to extend, it was "' + orderItem.type + '"');
		
		const calculatedPrice = this.calculatePrice(branch.payment.extendPrice, orderItem.discount);
		if (orderItem.amount != calculatedPrice) throw new BlError('orderItem.amount is not correct, it was "' + orderItem.amount + '", but should be "' + calculatedPrice + '"');
		return true;
	}
	
	private calculatePrice(price: number, discount?: number): number {
		return (discount) ? price + discount : price;
	}
}