
import {BlError, Branch, CustomerItem, Item, Order, OrderItem, Payment, Delivery} from "bl-model";
import {CustomerItemValidator} from "./customer-item-validator/customer-item-validator";
import {PriceValidator} from "./price-validator/price-validator";
import {BranchValidator} from "./branch-validator/branch-validator";
import {ItemValidator} from "./item-validator/item-validator";
import {BlDocumentStorage} from "../../../../storage/blDocumentStorage";
import {itemSchema} from "../../../item/item.schema";
import {branchSchema} from "../../../branch/branch.schema";
import {deliverySchema} from "../../../delivery/delivery.schema";
import {paymentSchema} from "../../../payment/payment.schema";
import {OrderPlacedValidator} from "./order-placed-validator/order-placed-validator";

type OiAttached = {orderItem: OrderItem, item: Item, branch: Branch};

export class OrderValidator {
	private priceValidator: PriceValidator;
	private orderPlacedValidator: OrderPlacedValidator;
	private branchValidator: BranchValidator;
	private itemValidator: ItemValidator;
	private itemStorage: BlDocumentStorage<Item>;
	private branchStorage: BlDocumentStorage<Branch>;
	private paymentStorage: BlDocumentStorage<Payment>;
	private deliveryStorage: BlDocumentStorage<Delivery>;
	
	constructor(branchStorage?: BlDocumentStorage<Branch>, itemStorage?: BlDocumentStorage<Item>,
				deliveryStorage?: BlDocumentStorage<Delivery>, paymentStorage?: BlDocumentStorage<Payment>) {
		
		this.itemStorage = (itemStorage) ? itemStorage : new BlDocumentStorage<Item>('items', itemSchema);
		this.branchStorage = (branchStorage) ? branchStorage : new BlDocumentStorage<Branch>('branches', branchSchema);
		this.deliveryStorage = (deliveryStorage) ? deliveryStorage : new BlDocumentStorage<Delivery>('deliveries', deliverySchema);
		this.paymentStorage = (paymentStorage) ? paymentStorage : new BlDocumentStorage('payments', paymentSchema);
		
		
		this.orderPlacedValidator = new OrderPlacedValidator(deliveryStorage, paymentStorage);
		this.priceValidator = new PriceValidator();
		this.branchValidator = new BranchValidator();
		this.itemValidator = new ItemValidator();
	}
	
	public async validate(order: Order): Promise<boolean> {
		
		
		try {
			this.validateFields(order);
			this.validateOrderItems(order);
			this.validatePayment(order);
		} catch (e) {
			if (e instanceof BlError) {
				return Promise.reject(e);
			}
			return Promise.reject(new BlError('order could not be validated'));
		}
	}
	
	private validateBranch(order: Order) {
	
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
	
	private validatePayment(order: Order): Promise<boolean> {
		return Promise.reject(false);
	}
	
	private validatePrice(order: Order, oiarr: OiAttached[]): boolean {
		for (let oi of oiarr) {
			try {
				this.priceValidator.validateOrder(order);
				this.priceValidator.validateOrderItem(oi.orderItem, oi.item, oi.branch);
				this.branchValidator.validateBranchInOrderItem(oi.branch, oi.orderItem);
			} catch (err) {
				if (err instanceof BlError) throw err;
				throw new BlError('could not validate the order');
			}
		}
		
		return true;
	}
	
	private validateOrderItems(order: Order) {
		try {
			//this.branchValidator.validateBranchInOrderItem(oi.branch, oi.orderItem);
			//this.itemValidator.validateItemInOrder(oi.item, oi.orderItem);
		} catch (err) {
			if (err instanceof BlError) throw err;
			throw new BlError('could not validate the orderItems');
		}
	}
	
	
	private attachToOrderItems(orderItems: OrderItem[], branch: Branch, items: Item[]): OiAttached[] {
		let oiarr: {orderItem: OrderItem, branch: Branch, item: Item}[] = [];
		
		for (let orderItem of orderItems) {
			let item = items.find(it => (orderItem.item == it.id));
			oiarr.push({orderItem: orderItem, branch: branch, item: item});
		}
		
		return oiarr;
	}
	
	private getBranch(id: string): Promise<Branch> {
		return new Promise((resolve, reject) => {
			this.branchStorage.get(id).then((branch: Branch) => {
				resolve(branch);
			}).catch((err: BlError) => {
				reject(err);
			});
		});
	};
	
	private getItems(orderItems: OrderItem[]): Promise<Item[]> {
		let itemIds: string[] = [];
		for (let orderItem of orderItems) {
			itemIds.push(orderItem.item);
		}
		
		return new Promise((resolve, reject) => {
			this.itemStorage.getMany(itemIds).then((items: Item[]) => {
				resolve(items);
			}).catch((itemError: BlError) => {
				reject(new BlError('could not get items').add(itemError));
			});
		});
	}
}