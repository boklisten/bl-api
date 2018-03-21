
import {BlError, Branch, CustomerItem, Item, Order, OrderItem, Payment, Delivery} from "bl-model";
import {BranchValidator} from "./branch-validator/branch-validator";
import {ItemValidator} from "./item-validator/item-validator";
import {BlDocumentStorage} from "../../../../storage/blDocumentStorage";
import {OrderPlacedValidator} from "./order-placed-validator/order-placed-validator";
import {OrderItemValidator} from "./order-item-validator/order-item-validator";
import {branchSchema} from "../../../branch/branch.schema";


export class OrderValidator {
	private orderPlacedValidator: OrderPlacedValidator;
	private orderItemValidator: OrderItemValidator;
	private branchValidator: BranchValidator;
	private branchStorage: BlDocumentStorage<Branch>;
	
	constructor(orderItemValidator?: OrderItemValidator, orderPlacedValidator?: OrderPlacedValidator,
				branchValidator?: BranchValidator, branchStorage?: BlDocumentStorage<Branch>) {
		
		this.orderItemValidator = (orderItemValidator) ? orderItemValidator : new OrderItemValidator();
		this.orderPlacedValidator = (orderPlacedValidator) ? orderPlacedValidator : new OrderPlacedValidator();
		this.branchValidator = (branchValidator) ? branchValidator : new BranchValidator();
		this.branchStorage = (branchStorage) ? branchStorage : new BlDocumentStorage<Branch>('branches', branchSchema);
	}
	
	public async validate(order: Order): Promise<boolean> {
		
		try {
			this.validateFields(order);
			let branch = await this.branchStorage.get(order.branch);
			
			await this.orderItemValidator.validate(branch, order);
			await this.branchValidator.validate(order);
			await this.orderPlacedValidator.validate(order);
		} catch (e) {
			if (e instanceof BlError) {
				return Promise.reject(e);
			
			}
			return Promise.reject(new BlError('order could not be validated').store('error', e));
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