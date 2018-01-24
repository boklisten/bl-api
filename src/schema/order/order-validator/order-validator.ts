
import {BlError, Branch, CustomerItem, Item, Order, OrderItem, OrderPayment} from "bl-model";
import {EndpointMongodb} from "../../../endpoint/endpoint.mongodb";
import {SEDocument} from "../../../db/model/se.document";
import {CustomerItemValidator} from "./customer-item-validator/customer-item-validator";
import {PriceValidator} from "./price-validator/price-validator";

export class OrderValidator {
	private customerItemValidator: CustomerItemValidator;
	private priceValicator: PriceValidator;
	
	constructor(private itemMongo: EndpointMongodb, private customerItemMongo: EndpointMongodb, private branchMongo: EndpointMongodb) {
		this.customerItemValidator = new CustomerItemValidator();
		this.priceValicator = new PriceValidator();
	}
	
	public async validate(order: Order): Promise<boolean> {
		let customerItems: CustomerItem[];
		let items: Item[];
		let oiarr: {orderItem: OrderItem, item: Item, branch: Branch, customerItem?: CustomerItem}[] = [];
		let branch: Branch;
		
		try {
			let branch = await this.getBranch(order.branch);
			let customerItems = await this.getCustomerItems(order.orderItems);
			let items = await this.getItems(order.orderItems);
		
			oiarr = this.attachToOrderItems(order.orderItems, branch, customerItems, items);
		
		} catch (err) {
			if (err instanceof BlError) throw err;
			throw new BlError('could not fetch the required customerItems, items and branch');
		}
	
		for (let oi of oiarr) {
			try {
				this.priceValicator.validateOrderItem(oi.orderItem, oi.customerItem, oi.item, oi.branch);
			} catch (err) {
				if (err instanceof BlError) throw err;
				throw new BlError('could not validate the price of the order');
			}
		}
	
		return true;
	}
	
	private attachToOrderItems(orderItems: OrderItem[], branch: Branch, customerItems: CustomerItem[], items: Item[]): {orderItem: OrderItem, branch: Branch, customerItem: CustomerItem, item: Item}[] {
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
	
	
	private validateCustomerItems(orderItems: OrderItem[], customerItems: CustomerItem[]): boolean {
		for (let orderItem of orderItems) {
			let cItem = customerItems.find(customerItem => {return orderItem.customerItem === customerItem.id});
			
			if (orderItem.type == 'rent') {
				if (orderItem.item !== cItem.item) throw new BlError('orderItem.item is not equal to customerItem.item');
				if (cItem && orderItem.amount !== cItem.totalAmount) throw new BlError('orderItem.amount is not equal to customerItem.totalAmount');
			}
		}
		return true;
	}
	
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
	
	private validateOrderAmountToPaymentAmounts(orderAmount: number, payments: OrderPayment[]): boolean {
		let totalAmount = 0;
		
		for (let payment of payments) {
			totalAmount += payment.amount;
		}
		if (totalAmount != orderAmount) throw new BlError('orderAmount does not equal the total of all payments amounts');
		return true;
		
	}
	
	private validateOrderAmountToOrderItemAmounts(orderAmount: number, orderItems: OrderItem[]): boolean {
		let totalAmount = 0;
		
		for(let orderItem of orderItems) {
			totalAmount += orderItem.amount;
		}
		if(totalAmount != orderAmount) throw new BlError('orderAmount does not equal the total of all order item amounts');
		return true;
	}
	
	private validateOrderItems(orderItems: OrderItem[]): boolean {
		for (let orderItem of orderItems) {
			if (orderItem.type === "rent") {
				if (!orderItem.customerItem) throw new BlError('orderItem has type rent but no customerItem attached');
			}
		}
		return true;
	}
}