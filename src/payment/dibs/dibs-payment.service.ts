


import {BlError, Order, OrderItem} from "@wizardcoder/bl-model";
import {DibsEasyItem} from "./dibs-easy-item/dibs-easy-item";
import {DibsEasyOrder} from "./dibs-easy-order/dibs-easy-order";
import {HttpHandler} from "../../http/http.handler";
import {APP_CONFIG} from "../../application-config";
import {DibsEasyPayment} from "./dibs-easy-payment/dibs-easy-payment";

export class DibsPaymentService {
	
	constructor() {
	
	}
	
	public getDibsPayment(dibsPaymentId: string): Promise<DibsEasyPayment> {
		return new Promise((resolve, reject) => {
		    let httpHandler: HttpHandler = new HttpHandler();
		    
		    httpHandler.get(process.env.DIBS_URI + APP_CONFIG.path.dibs.payment + '/' + dibsPaymentId, process.env.DIBS_SECRET_KEY).then((jsonRepsonse) => {
		    	resolve(jsonRepsonse['payment'] as DibsEasyPayment);
			}).catch((getError: BlError)  => {
		    	reject(new BlError('could not get payment from dibs api from dibs api').add(getError))
			})
		});
	}
	
	public getPaymentId(dibsEasyOrder: DibsEasyOrder): Promise<string> {
		return new Promise((resolve, reject) => {
			let httpHandler: HttpHandler = new HttpHandler();
			httpHandler.post(process.env.DIBS_URI + APP_CONFIG.path.dibs.payment, dibsEasyOrder, process.env.DIBS_SECRET_KEY).then((responseData: string) => {
				if (responseData) {
					if (responseData['paymentId']) {
						return resolve(responseData['paymentId']);
					}
				}
				return reject(new BlError('did not get the paymentId back from dibs'));
			}).catch((blError: BlError) => {
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
		
		dibsEasyOrder.order.reference = order.id;
		dibsEasyOrder.order.items = items;
		dibsEasyOrder.order.amount = this.getTotalGrossAmount(items);
		dibsEasyOrder.order.currency = "NOK";
		
		dibsEasyOrder.checkout = {
			url: process.env.CLIENT_URI + APP_CONFIG.path.client.checkout,
			termsUrl: process.env.CLIENT_URI + APP_CONFIG.path.client.agreement.rent,
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
	
	private validateOrderPayments(payments: string[]) {
		/*
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
		*/
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