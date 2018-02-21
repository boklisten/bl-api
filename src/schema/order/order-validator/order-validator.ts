
import {BlError, Branch, CustomerItem, Item, Order, OrderItem, OrderPayment} from "bl-model";
import {EndpointMongodb} from "../../../endpoint/endpoint.mongodb";
import {SEDocument} from "../../../db/model/se.document";
import {CustomerItemValidator} from "./customer-item-validator/customer-item-validator";
import {PriceValidator} from "./price-validator/price-validator";
import {BranchValidator} from "./branch-validator/branch-validator";
import {ItemValidator} from "./item-validator/item-validator";

type OiAttached = {orderItem: OrderItem, item: Item, branch: Branch, customerItem: CustomerItem};

export class OrderValidator {
	private customerItemValidator: CustomerItemValidator;
	private priceValicator: PriceValidator;
	private branchValidator: BranchValidator;
	private itemValidator: ItemValidator;
	
	constructor(private itemMongo: EndpointMongodb, private customerItemMongo: EndpointMongodb, private branchMongo: EndpointMongodb) {
		this.customerItemValidator = new CustomerItemValidator();
		this.priceValicator = new PriceValidator();
		this.branchValidator = new BranchValidator();
		this.itemValidator = new ItemValidator();
	}
	
	public async validate(order: Order): Promise<boolean> {
			let oiarr: OiAttached[] = [];
			
			let customerItems: CustomerItem[];
			let branch: Branch;
			let items: Item[];
			
			if (!order.orderItems || order.orderItems.length <= 0) return Promise.reject(new BlError('order.orderItems is empty or undefined'));
			
			try {
				branch = await this.getBranch(order.branch);
				customerItems = await this.getCustomerItems(order.orderItems);
				
				items = await this.getItems(order.orderItems);
				
				oiarr = this.attachToOrderItems(order.orderItems, branch, customerItems, items);
				
			} catch (err) {
				if (err instanceof BlError) return Promise.reject(err);
				return Promise.reject(new BlError('could not get branch, customerItems or items'));
			}
			
			try {
				this.validatePrice(order, oiarr);
				this.validateOrderItems(oiarr);
				//this.validateCustomerItems(order.orderItems, customerItems);
			} catch (err) {
				if (err instanceof BlError) return Promise.reject(err);
				return Promise.reject(new BlError('could not validate order'));
			}
			
			Promise.resolve(true);
	}
	
	private validatePrice(order: Order, oiarr: OiAttached[]): boolean {
		for (let oi of oiarr) {
			try {
				this.priceValicator.validateOrder(order);
				this.priceValicator.validateOrderItem(oi.orderItem, oi.customerItem, oi.item, oi.branch);
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
	
	private validateCustomerItems(orderItems: OrderItem[], customerItems: CustomerItem[]): boolean {
		try {
			this.customerItemValidator.validateWithOrderItems(orderItems, customerItems);
		} catch(err) {
			if (err instanceof BlError) throw err;
			throw new BlError('could not validate customerItems');
		}
		
		return true;
	}
	
	
	private attachToOrderItems(orderItems: OrderItem[], branch: Branch, customerItems: CustomerItem[], items: Item[]): OiAttached[] {
		let oiarr: {orderItem: OrderItem, branch: Branch, customerItem: CustomerItem, item: Item}[] = [];
		
		for (let orderItem of orderItems) {
			let customerItem = customerItems.find(ci => (orderItem.customerItem == ci.id));
			let item = items.find(it => (orderItem.item == it.id));
			oiarr.push({orderItem: orderItem, branch: branch, customerItem: customerItem, item: item});
		}
		
		return oiarr;
	}
	
	private getBranch(id: string): Promise<Branch> {
		return new Promise((resolve, reject) => {
			this.branchMongo.getById(id).then((docs: SEDocument[]) => {
				resolve(docs[0].data);
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
			this.itemMongo.getManyById(itemIds).then((docs: SEDocument[]) => {
				let items: Item[] = [];
				for (let doc of docs) {
					items.push(doc.data as Item);
				}
				resolve(items);
			}).catch((itemError: BlError) => {
				reject(new BlError('could not get items').add(itemError));
			});
		});
	}
	
	private getCustomerItems(orderItems: OrderItem[]): Promise<CustomerItem[]> {
		let customerItemIds: string[] = [];
		
		for (let orderItem of orderItems) {
			if (orderItem.type === 'rent') customerItemIds.push(orderItem.customerItem);
		}
		
		return new Promise((resolve, reject) => {
			this.customerItemMongo.getManyById(customerItemIds).then((docs: SEDocument[]) => {
				let customerItems: CustomerItem[] = [];
				
				for (let doc of docs) {
					customerItems.push(doc.data as CustomerItem);
				}
				
				
				resolve(customerItems);
			}).catch((ciDocError: BlError) => {
				reject(new BlError('could not get customerItems based on the ids provided').add(ciDocError));
			});
		});
		
	}
}