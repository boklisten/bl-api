
import {BlError, Branch, CustomerItem, Item, Order, OrderItem, Payment, Delivery} from "@wizardcoder/bl-model";
import {BranchValidator} from "./branch-validator/branch-validator";
import {ItemValidator} from "./item-validator/item-validator";
import {BlDocumentStorage} from "../../../../storage/blDocumentStorage";
import {OrderPlacedValidator} from "./order-placed-validator/order-placed-validator";
import {OrderItemValidator} from "./order-item-validator/order-item-validator";
import {branchSchema} from "../../../branch/branch.schema";
import {OrderFieldValidator} from "./order-field-validator/order-field-validator";
import {OrderUserDetailValidator} from "./order-user-detail-validator/order-user-detail-validator";


export class OrderValidator {
	private orderPlacedValidator: OrderPlacedValidator;
	private orderItemValidator: OrderItemValidator;
	private branchValidator: BranchValidator;
	private branchStorage: BlDocumentStorage<Branch>;
	private orderFieldValidator: OrderFieldValidator;
	private orderUserDetailValidator: OrderUserDetailValidator;


	constructor(orderItemValidator?: OrderItemValidator,
				orderPlacedValidator?: OrderPlacedValidator,
				branchValidator?: BranchValidator,
				branchStorage?: BlDocumentStorage<Branch>,
				orderFieldValidator?: OrderFieldValidator,
				orderUserDetailValidator?: OrderUserDetailValidator) {
		
		this.orderItemValidator = (orderItemValidator) ? orderItemValidator : new OrderItemValidator();
		this.orderPlacedValidator = (orderPlacedValidator) ? orderPlacedValidator : new OrderPlacedValidator();
		this.branchValidator = (branchValidator) ? branchValidator : new BranchValidator();
		this.branchStorage = (branchStorage) ? branchStorage : new BlDocumentStorage<Branch>('branches', branchSchema);
		this.orderFieldValidator = (orderFieldValidator) ? orderFieldValidator : new OrderFieldValidator();
		this.orderUserDetailValidator = (orderUserDetailValidator) ? orderUserDetailValidator : new OrderUserDetailValidator();
	}
	
	public async validate(order: Order): Promise<boolean> {
		
		try {
			await this.orderUserDetailValidator.validate(order);
			await this.orderFieldValidator.validate(order);
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

	private validateUser(userDetailId: string): Promise<boolean> {
		return new Promise((resolve, reject) => {

		});
	}
}