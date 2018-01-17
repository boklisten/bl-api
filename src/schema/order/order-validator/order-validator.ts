
import {BlError, CustomerItem, Item, Order, OrderItem, OrderPayment} from "bl-model";
import {EndpointMongodb} from "../../../endpoint/endpoint.mongodb";
import {SEDocument} from "../../../db/model/se.document";
import {CustomerItemValidator} from "./customer-item-validator/customer-item-validator";

export class OrderValidator {
	private customerItemValidator: CustomerItemValidator;
	
	constructor(private itemMongo: EndpointMongodb, private customerItemMongo: EndpointMongodb) {
		this.customerItemValidator = new CustomerItemValidator();
	}
	
	public async validate(order: Order): Promise<boolean> {
		try {
			this.validateOrderAmountToOrderItemAmounts(order.amount, order.orderItems);
			this.validateOrderAmountToPaymentAmounts(order.amount, order.payments);
			this.validateOrderItems(order.orderItems);
			
			const customerItems = await this.getCustomerItems(order.orderItems);
			const items = await this.getItems(order.orderItems);
			
			this.customerItemValidator.validateWithOrderItems(order.orderItems, customerItems);
			
			//this.validateCustomerItems(order.orderItems, customerItems);
			
			return Promise.resolve(true);
			
		} catch (validateError) {
			if (validateError instanceof BlError) return Promise.reject(validateError);
			return Promise.reject(new BlError('order is not valid, unknown error'));
		}
	}
	
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