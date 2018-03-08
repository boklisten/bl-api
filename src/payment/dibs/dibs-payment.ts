

import {BlError, Order, OrderItem, OrderPayment} from "bl-model";
import {DibsEasyItem} from "./dibs-easy-item/dibs-easy-item";
import {DibsEasyOrder} from "./dibs-easy-order/dibs-easy-order";

export class DibsPayment {
	
	
	public getPaymentId(dibsEasyOrder: DibsEasyOrder): Promise<string> {
		return new Promise((resolve, reject) => {
			console.log('hi hellow there');
			
			const http = require('http');
			
			const postData = JSON.stringify(dibsEasyOrder);
			
			const options = {
				hostname: 'test.api.dibspayment.eu',
				port: 80,
				path: '/v1/payments',
				method: 'POST',
				headers: {
					'content-type': 'application/json',
					'accept': 'application/json',
					'authorization': '100000934'
				}
			};
			
			const req = http.request(options, (res) => {
				res.setEncoding('utf8');
				let data = '';
				res.on('data', (chunk) => {
					console.log(`BODY: ${chunk}`);
					data += chunk;
				});
				res.on('end', () => {
					console.log('here are the data: "' + data + '"');
					resolve('data: ' + data);
				});
			});
			
			req.on('error', (e) => {
				console.error(`problem with request: ${e.message}`);
				reject(new BlError('problem with request').store('message', e.message));
			});
			
			console.log('we are ready to send post request');
			
			// write data to request body
			req.write(postData);
			req.end();
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