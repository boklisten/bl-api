
import {Branch, OrderItem, Item, BlError} from 'bl-model';
import {isNullOrUndefined} from "util";
import {PriceService} from "../../../../../../price/price.service";

export class OrderItemRentValidator {
	private priceService: PriceService;
	
	constructor() {
		this.priceService = new PriceService();
	}
	
	public async validate(branch: Branch, orderItem: OrderItem, item: Item): Promise<boolean> {
		try {
			await this.validateOrderItemPriceTypeRent(orderItem, item, branch);
		} catch (e) {
			if (e instanceof BlError) {
				return Promise.reject(e);
			}
			return Promise.reject(new BlError('unkown error, could not validate orderItem type rent').store('error', e));
		}
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
	
}