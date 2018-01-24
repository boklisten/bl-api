
import {BlError, Branch, CustomerItem, Item, Order, OrderItem} from "bl-model";
import {PriceValidatorCancel} from "./price-validator-cancel/price-validator-cancel";
import {PriceValidatorOrder} from "./price-validator-order/price-validator-order";

export class PriceValidator {
	private precision: number;
	private priceValidatorCancel: PriceValidatorCancel;
	private priceValidatorOrder: PriceValidatorOrder;
	
	constructor() {
		this.precision = 2;
		this.priceValidatorCancel = new PriceValidatorCancel();
		this.priceValidatorOrder = new PriceValidatorOrder();
		
	}
	
	public validateOrder(order: Order): boolean {
		try {
			this.priceValidatorOrder.validate(order);
		} catch (err) {
			if (err instanceof BlError) throw new BlError('could not validate the price of order').add(err);
			throw new BlError('could not validate the price of order');
		}
		
		return true;
	}
	
	public validateOrderItem(orderItem: OrderItem, customerItem: CustomerItem, item: Item, branch: Branch): boolean {
		switch (orderItem.type) {
			case 'buy':
				this.validateOrderItemTypeBuy(orderItem, item);
				break;
			case 'sell':
				this.validateOrderItemTypeSell(orderItem, item);
				break;
			case 'rent':
				this.validateOrderItemTypeRent(orderItem, customerItem, item, branch);
				break;
			default:
				throw new BlError('orderItem.type "' + orderItem.type + '" is not supported by PriceValidator');
		}
		return true;
	}
	
	private validateOrderItemTypeRent(orderItem: OrderItem, customerItem: CustomerItem, item: Item, branch: Branch): boolean {
		if (!orderItem.rentInfo) throw new BlError('orderItem.rentInfo is not defined when orderItem.type is rent');
		if (orderItem.rentInfo.oneSemester == orderItem.rentInfo.twoSemesters) throw new BlError('orderItem.rentInfo.oneSemester and twoSemesters can not be equal');
		if (orderItem.rentInfo.oneSemester) {
			const calculatedPrice = this.calculateOrderItemPrice(item.price * branch.payment.rentPricePercentage.oneSemester, orderItem.discount);
			if (calculatedPrice != orderItem.amount) {
				throw new BlError('orderItem.amount is not correct, it was "' + orderItem.amount + '" but should be "' + calculatedPrice + '"');
			}
		}
		
		if (orderItem.rentInfo.twoSemesters) {
			const calculatedPrice = this.calculateOrderItemPrice(item.price * branch.payment.rentPricePercentage.twoSemesters, orderItem.discount);
			if (calculatedPrice != orderItem.amount) {
				throw new BlError('orderItem.amount is not correct, it was "' + orderItem.amount + '" but should be "' + calculatedPrice + '"');
			}
		}
		
		return true;
	}
	
	private validateOrderItemTypeSell(orderItem: OrderItem, item: Item): boolean {
		let calculatedValue = this.calculateOrderItemPrice(item.sellPrice, orderItem.discount) + orderItem.amount;
		if (calculatedValue != 0) throw new BlError('orderItem.amount is not correct, was "' + calculatedValue +'", but should be 0');
		return true;
	}
	
	private validateOrderItemTypeBuy(orderItem: OrderItem, item: Item): boolean {
		let calculatedPrice = this.calculateOrderItemPrice(item.price, orderItem.discount);
		if (orderItem.amount != calculatedPrice) throw new BlError('orderItem.amount is not correct, it was "' + orderItem.amount + '", but should be "' + calculatedPrice + '"');
		return true;
	}
	
	
	private calculateOrderItemPrice(price: number, discount?: number) {
		return this.toFixed((discount) ? price + discount : price);
	}
	
	private toFixed(num: number): number {
		const power = Math.pow(10, this.precision || 0);
		return (Math.round(num * power) / power);
	}
}