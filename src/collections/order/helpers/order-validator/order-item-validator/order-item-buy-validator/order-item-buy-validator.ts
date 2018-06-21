

import {BlError, Item, OrderItem, Branch} from '@wizardcoder/bl-model';
import {BlDocumentStorage} from "../../../../../../storage/blDocumentStorage";
import {error, isNullOrUndefined} from "util";
import {PriceService} from "../../../../../../price/price.service";

export class OrderItemBuyValidator {
	private priceService: PriceService;
	
	constructor(priceService?: PriceService) {
		
		this.priceService = (priceService) ? priceService : new PriceService({roundDown: true});
	}
	
	public async validate(branch: Branch, orderItem: OrderItem, item: Item): Promise<boolean> {
		try {
			this.validateOrderItemFields(orderItem, item);
			
			await this.validateOrderItemPriceTypeBuy(orderItem, item);
			
		} catch (e) {
			if (e instanceof BlError) {
				return Promise.reject(e);
			}
			return Promise.reject(new BlError('unknown error, could not validate price of orderItems, error: ' + e.message).store('error', e));
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
	
	private validateOrderItemPriceTypeBuy(orderItem: OrderItem, item: Item): boolean {
		let price;
		if (orderItem.discount) {
			if (isNullOrUndefined(orderItem.discount.amount)) {
				throw new BlError('orderItem.discount was set, but no discount.amount provided');
			}
			
			price = this.priceService.sanitize(item.price - orderItem.discount.amount);
			
		} else {
			price = this.priceService.sanitize(item.price);
			
		}

		let expectedPrice = this.priceService.round(price);
		
		if (orderItem.amount != expectedPrice) {
			throw new BlError(`orderItem.amount "${orderItem.amount}" is not equal to item.price "${item.price}" - orderItem.discount "${orderItem.discount || 0}" = "${expectedPrice}" when type is "buy"`);
		}
		
		return true;
	}
}