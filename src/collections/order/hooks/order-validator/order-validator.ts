
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

type OiAttached = {orderItem: OrderItem, item: Item, branch: Branch};

export class OrderValidator {
	private customerItemValidator: CustomerItemValidator;
	private priceValicator: PriceValidator;
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
		
		this.customerItemValidator = new CustomerItemValidator();
		this.priceValicator = new PriceValidator();
		this.branchValidator = new BranchValidator();
		this.itemValidator = new ItemValidator();
	}
	
	public async validate(order: Order): Promise<boolean> {
			let oiarr: OiAttached[] = [];
			
			let branch: Branch;
			let items: Item[];
			
			if (!order.orderItems || order.orderItems.length <= 0) return Promise.reject(new BlError('order.orderItems is empty or undefined'));
			
			try {
				branch = await this.getBranch(order.branch);
				
				items = await this.getItems(order.orderItems);
				
				oiarr = this.attachToOrderItems(order.orderItems, branch, items);
				
			} catch (err) {
				if (err instanceof BlError) return Promise.reject(err);
				return Promise.reject(new BlError('could not get branch, customerItems or items'));
			}
			
			try {
				this.validatePrice(order, oiarr);
				this.validateOrderItems(oiarr);
				await this.validateOrderPlaced(order);
				
			} catch (err) {
				if (err instanceof BlError) return Promise.reject(err);
				return Promise.reject(new BlError('could not validate order'));
			}
			
			
			
			Promise.resolve(true);
	}
	
	private validateOrderPlaced(order: Order): Promise<boolean> {
		return new Promise((resolve, reject) => {
			
			if (!order.placed) {
				resolve(true);
			}
			
			if (!order.delivery || order.delivery.length <= 0) {
				return reject(new BlError('order.placed is set but delivery is undefined'));
			}
			
			if (!order.payments || order.payments.length <= 0 || !order.payments[0]) {
				return reject(new BlError('order.placed is set but order.payments is empty or undefined'));
			}
			
			this.deliveryStorage.get(order.delivery).then((delivery: Delivery) => {
				
				if (delivery.order !== order.id) {
					reject(new BlError('order.id is not equal to delivery.order'));
				}
				
				let orderItemAmount = 0;
				for (let orderItem of order.orderItems) {
					orderItemAmount += orderItem.amount;
				}
				
				if ((orderItemAmount + delivery.amount) !== order.amount) {
					reject(new BlError('total of order.orderItems amount + delivery.amount is not equal to order.amount'));
				}
				
				this.paymentStorage.getMany(order.payments).then((payments: Payment[]) => {
					
					let paymentTotal = 0;
					for (let payment of payments) {
						if (!payment.confirmed) {
							return reject(new BlError('payment is not confirmed').store('paymentId', payment.id));
						}
						paymentTotal += payment.amount;
					}
					
					if (paymentTotal != order.amount) {
						return reject(new BlError('total amount of payments is not equal to order.amount'));
					}
					
				
				}).catch((blError: BlError) => {
					reject(new BlError('order.payments is not found').code(702).add(blError));
				});
				
			
			}).catch((blError: BlError) => {
				reject(new BlError('order.placed is set but delivery was not found').add(blError));
			});
		});
	}
	
	
	private validatePrice(order: Order, oiarr: OiAttached[]): boolean {
		for (let oi of oiarr) {
			try {
				this.priceValicator.validateOrder(order);
				this.priceValicator.validateOrderItem(oi.orderItem, oi.item, oi.branch);
				this.branchValidator.validateBranchInOrderItem(oi.branch, oi.orderItem);
			} catch (err) {
				if (err instanceof BlError) throw err;
				throw new BlError('could not validate the order');
			}
		}
		
		return true;
	}
	
	private validateOrderItems(oiarr: OiAttached[]) {
		for (let oi of oiarr) {
			try {
				this.branchValidator.validateBranchInOrderItem(oi.branch, oi.orderItem);
				this.itemValidator.validateItemInOrder(oi.item, oi.orderItem);
			} catch (err) {
				if (err instanceof BlError) throw err;
				throw new BlError('could not validate the orderItems');
			}
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