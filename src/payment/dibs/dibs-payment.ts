

import {BlError, Order, OrderItem, OrderPayment} from "bl-model";
import {DibsEasyItem} from "./dibs-easy-item/dibs-easy-item";
import {DibsEasyOrder} from "./dibs-easy-order/dibs-easy-order";
import {HttpHandler} from "../../http/http.handler";

export class DibsPayment {
	
	constructor() {
	
	}
	
	
	public getPaymentId(dibsEasyOrder: DibsEasyOrder): Promise<string> {
		//console.log('dibsEasy order: ', dibsEasyOrder);
		return new Promise((resolve, reject) => {
			let httpHandler: HttpHandler = new HttpHandler();
			
			httpHandler.post(JSON.stringify(dibsEasyOrder), 'test.api.dibspayment.eu',
				'/v1/payments', 'f82b1743410b4f91adcc6420390096d4').then((responseData: string) => {
				console.log('we got a response from dibs!', responseData);
				resolve(responseData);
			}).catch((blError: BlError) => {
				console.log('there was an error with the request to dibs', blError);
				reject(new BlError('could not get paymentID from dibs').add(blError));
			});
		});
	}
	
	public orderToDibsEasyOrder(order: Order): DibsEasyOrder {
		this.validateOrder(order);
		this.validateOrderPayments(order.payments);
		
		let items: DibsEasyItem[] = [];
		
		for (let orderItem of order.orderItems) {
			items.push(this.orderItemToEasyItem(orderItem));
		}
		
		let dibsEasyOrder: DibsEasyOrder = new DibsEasyOrder();
		
		dibsEasyOrder.reference = order.id;
		dibsEasyOrder.items = items;
		dibsEasyOrder.amount = this.getTotalGrossAmount(items);
		dibsEasyOrder.currency = "NOK";
		dibsEasyOrder.checkout = {
			url: "",
			ShippingCountries: [
				{countryCode: "NOR"}
			]
		};
		
		return dibsEasyOrder;
		
	}
	
	private validateOrder(order: Order) {
		if (!order.id || order.id.length <= 0) throw new BlError('order.id is not defined');
		if (!order.byCustomer) throw new BlError('order.byCustomer is false, no need to make dibs easy order');
		if (order.amount == 0) throw new BlError('order.amount is zero');
	}
	
	private validateOrderPayments(payments: OrderPayment[]) {
		let numOfDibsPayments = 0;
		
		for (let payment of payments) {
			if (payment.method === "dibs") {
				numOfDibsPayments += 1;
			}
		}
		
		if (numOfDibsPayments > 1) {
			throw new BlError('order.payments include more than one payment with method "dibs"');
		}
		
		if (numOfDibsPayments < 1) {
			throw new BlError('order.payments does not include a payment with method "dibs"');
		}
	}
	
	
	private getTotalGrossAmount(dibsEasyItems: DibsEasyItem[]): number {
		let sum = 0;
		for (let dbi of dibsEasyItems) {
			sum += dbi.grossTotalAmount;
		}
		return sum;
	}
	
	
	private orderItemToEasyItem(orderItem: OrderItem): DibsEasyItem {
		let dibsEasyItem = new DibsEasyItem();
		
		dibsEasyItem.reference = orderItem.item ;
		dibsEasyItem.name = orderItem.title;
		dibsEasyItem.quantity = 1;
		dibsEasyItem.unit = "book";
		dibsEasyItem.unitPrice = this.toEars(orderItem.unitPrice);
		dibsEasyItem.taxRate = this.toEars(orderItem.taxRate * 100);
		dibsEasyItem.taxAmount = this.toEars(orderItem.taxAmount);
		dibsEasyItem.netTotalAmount = this.toEars(orderItem.unitPrice);
		dibsEasyItem.grossTotalAmount = this.toEars(orderItem.amount);
		
		return dibsEasyItem;
	}
	
	private toEars(price: number): number {
		return price * 100;
	}
}