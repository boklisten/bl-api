

import {Order, OrderItem, BlError, Branch, Item} from 'bl-model';
import {isNullOrUndefined, isNumber} from "util";
import {OrderItemExtendValidator} from "./order-item-extend-validator/order-item-extend-validator";
import {BlDocumentStorage} from "../../../../../storage/blDocumentStorage";
import {branchSchema} from "../../../../branch/branch.schema";
import {itemSchema} from "../../../../item/item.schema";
import {OrderItemBuyValidator} from "./order-item-buy-validator/order-item-buy-validator";
import {OrderItemRentValidator} from "./order-item-rent-validator/order-item-rent-validator";
import {OrderFieldValidator} from "../order-field-validator/order-field-validator";

export class OrderItemValidator {
	private orderItemFieldValidator: OrderFieldValidator;
	private orderItemExtendValidator: OrderItemExtendValidator;
	private orderItemBuyValidator: OrderItemBuyValidator;
	private orderItemRentValidator: OrderItemRentValidator;
	private branchStorage: BlDocumentStorage<Branch>;
	private itemStorage: BlDocumentStorage<Item>;
	
	constructor(branchStorage?: BlDocumentStorage<Branch>, itemStorage?: BlDocumentStorage<Item>, orderItemFieldValidator?: OrderFieldValidator,
				orderItemRentValidator?: OrderItemRentValidator, orderItemBuyValidator?: OrderItemBuyValidator,
				orderItemExtendValidator?: OrderItemExtendValidator) {
		
		this.branchStorage = (branchStorage) ? branchStorage : new BlDocumentStorage('branches', branchSchema);
		this.itemStorage = (itemStorage) ? itemStorage : new BlDocumentStorage('items', itemSchema);
		
		this.orderItemFieldValidator = (orderItemFieldValidator) ? orderItemFieldValidator : new OrderFieldValidator();
		this.orderItemRentValidator = (orderItemRentValidator) ? orderItemRentValidator : new OrderItemRentValidator();
		this.orderItemBuyValidator = (orderItemBuyValidator) ? orderItemBuyValidator : new OrderItemBuyValidator();
		this.orderItemExtendValidator = (orderItemExtendValidator) ? orderItemExtendValidator : new OrderItemExtendValidator();
	}
	
	
	public async validate(branch: Branch, order: Order): Promise<boolean> {
	
		try {
			await this.orderItemFieldValidator.validate(order);
			this.validateAmount(order);
			
			for (let orderItem of order.orderItems) {
				let item = await this.itemStorage.get(orderItem.item);
				await this.validateOrderItemBasedOnType(branch, item, orderItem);
			
			}
			
		} catch (e) {
			if (e instanceof BlError) {
				return Promise.reject(e);
			}
			return Promise.reject(new BlError('unknown error, orderItem could not be validated').store('error', e));
		}
	}
	
	private async validateOrderItemBasedOnType(branch: Branch, item: Item, orderItem: OrderItem): Promise<boolean> {
		switch (orderItem.type) {
			case "rent":
				return await this.orderItemRentValidator.validate(branch, orderItem, item);
			case "buy":
				return await this.orderItemBuyValidator.validate(branch, orderItem, item);
			case "extend":
				return await this.orderItemExtendValidator.validate(branch, orderItem);
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
}