

import {Order, BlError, Item, OrderItem, Branch} from 'bl-model';
import {OrderItemFieldValidator} from "../order-item-field-validator/order-item-field-validator";
import {BlDocumentStorage} from "../../../../../../storage/blDocumentStorage";
import {itemSchema} from "../../../../../item/item.schema";
import {error, isNullOrUndefined} from "util";
import {branchSchema} from "../../../../../branch/branch.schema";
import {PriceService} from "../../../../../../price/price.service";

export class OrderItemPriceValidator {
	private orderItemFieldValidator: OrderItemFieldValidator;
	private itemStorage: BlDocumentStorage<Item>;
	private branchStorage: BlDocumentStorage<Branch>;
	private priceService: PriceService;
	
	constructor(orderItemFieldValidator?: OrderItemFieldValidator, priceService?: PriceService, itemStorage?: BlDocumentStorage<Item>,
				branchStorage?: BlDocumentStorage<Branch>) {
		
		this.orderItemFieldValidator = (orderItemFieldValidator) ? orderItemFieldValidator : new OrderItemFieldValidator();
		this.itemStorage = (itemStorage) ? itemStorage : new BlDocumentStorage('items', itemSchema);
		this.branchStorage = (branchStorage) ? branchStorage : new BlDocumentStorage('branches', branchSchema);
		this.priceService = (priceService) ? priceService : new PriceService();
	}
	
	public async validate(order: Order): Promise<boolean> {
		try {
			await this.orderItemFieldValidator.validate(order);
			let branch = await this.branchStorage.get(order.branch);
			
			for (let orderItem of order.orderItems) {
				let item = await this.itemStorage.get(orderItem.item);
				this.validateOrderItemFields(orderItem, item);
				await this.validateBasedOnType(orderItem, item, branch);
			}
			
			
		} catch (e) {
			if (e instanceof BlError) {
				return Promise.reject(e);
			}
			return Promise.reject(new BlError('unknown error, could not validate price of orderItems, error: ' + e.message).store('error', e));
		}
		
		return Promise.resolve(true);
	}
	
	private validateBasedOnType(orderItem: OrderItem, item: Item, branch: Branch): Promise<boolean> {
		switch (orderItem.type) {
			case "buy":
				this.validateOrderItemPriceTypeBuy(orderItem, item);
				break;
			case "rent":
				this.validateOrderItemPriceTypeRent(orderItem, item, branch);
				break;
			case "extend":
				break;
		}
		return Promise.resolve(true);
	}
	
	
	
	private validateOrderItemFields(orderItem: OrderItem, item: Item): boolean {
		if (orderItem.taxRate != item.taxRate) {
			throw new BlError(`orderItem.taxRate "${orderItem.taxRate}" is not equal to item.taxRate "${item.taxRate}"`);
		}
		
		let expectedTaxAmount = orderItem.amount * item.taxRate;
		
		if (orderItem.taxAmount != expectedTaxAmount) {
			throw new BlError(`orderItem.taxAmount "${orderItem.taxAmount}" is not equal to (orderItem.amount "${orderItem.amount}" * item.taxRate "${item.taxRate}") "${expectedTaxAmount}"`);
		}
		
		return true;
	}
	
	private validateOrderItemPriceTypeRent(orderItem: OrderItem, item: Item, branch: Branch): boolean {
		this.validateOrderItemInfoFields(orderItem);
		
		if (!item.rent) {
			throw new BlError('orderItem.type is "rent" but item.rent is false');
		}
		
		if (isNullOrUndefined(branch.paymentInfo.rentPeriods)) {
			throw new BlError('branch.paymentInfo.rentPeriods is undefined');
		}
		
		for (let rentPeriod of branch.paymentInfo.rentPeriods) {
			if (rentPeriod.type === orderItem.info.periodType) {
				let rentalPrice;
				
				if (orderItem.discount) {
					rentalPrice = this.priceService.sanitize((item.price * rentPeriod.percentage) - orderItem.discount.amount);
				} else {
					rentalPrice = this.priceService.sanitize(item.price * rentPeriod.percentage);
				}
				
				if (orderItem.amount !== rentalPrice) {
					throw new BlError(`orderItem.amount "${orderItem.amount}" is not equal to the rental price "${rentalPrice}"`);
				}
				
				return true;
			}
		}
		
		throw new BlError('rent price could not be validated');
	}
	
	private validateOrderItemInfoFields(orderItem: OrderItem): boolean {
		if (isNullOrUndefined(orderItem.info)) {
			throw new BlError('orderItem.info is not set when orderItem.type is "rent"');
		}
		return true;
	}
	
	private validateOrderItemPriceTypeBuy(orderItem: OrderItem, item: Item): boolean {
		let price;
		if (orderItem.discount) {
			if (isNullOrUndefined(orderItem.discount.amount)) {
				throw new BlError('orderItem.discount was set, but no discount.amount provided');
			}
			
			price = this.priceService.sanitize(item.price - orderItem.discount.amount);
			
		} else {
			price = item.price;
			
		}
		
		if (orderItem.amount != price) {
			throw new BlError(`orderItem.amount "${orderItem.amount}" is not equal to item.price - orderItem.discount "${price}" when type is "buy"`);
		}
		
		return true;
	}
}