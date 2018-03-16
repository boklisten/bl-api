
import {BlError, Branch, CustomerItem, Item, Order, OrderItem, Payment, Delivery} from "bl-model";
import {BranchValidator} from "./branch-validator/branch-validator";
import {ItemValidator} from "./item-validator/item-validator";
import {BlDocumentStorage} from "../../../../storage/blDocumentStorage";
import {OrderPlacedValidator} from "./order-placed-validator/order-placed-validator";
import {OrderItemValidator} from "./order-item-validator/order-item-validator";


export class OrderValidator {
	private orderPlacedValidator: OrderPlacedValidator;
	private orderItemValidator: OrderItemValidator;
	private branchValidator: BranchValidator;
	
	constructor(orderItemValidator?: OrderItemValidator, orderPlacedValidator?: OrderPlacedValidator,
				branchValidator?: BranchValidator) {
		
		this.orderItemValidator = (orderItemValidator) ? orderItemValidator : new OrderItemValidator();
		this.orderPlacedValidator = (orderPlacedValidator) ? orderPlacedValidator : new OrderPlacedValidator();
		this.branchValidator = (branchValidator) ? branchValidator : new BranchValidator();
	}
	
	public async validate(order: Order): Promise<boolean> {
		
		try {
			this.validateFields(order);
			await this.orderItemValidator.validate(order);
			await this.branchValidator.validate(order);
			await this.orderPlacedValidator.validate(order);
		} catch (e) {
			if (e instanceof BlError) {
				return Promise.reject(e);
			
			}
			return Promise.reject(new BlError('order could not be validated'));
		}
		return Promise.resolve(true);
	}
	
	private validateFields(order: Order): boolean {
		if (!order.amount) {
			throw new BlError('order.amount is undefined');
		}
		
		if (!order.orderItems || order.orderItems.length <= 0) {
			throw new BlError('order.orderItems is empty or undefined');
		}
		
		return true;
	}
}