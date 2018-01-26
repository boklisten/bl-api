

import {BlError, Order, OrderItem} from "bl-model";
import {DibsEasyItem} from "./dibs-easy-item/dibs-easy-item";
import {DibsEasyOrder} from "./dibs-easy-order/dibs-easy-order";

export class DibsPayment {
	
	public orderToDibsEasyOrder(order: Order) {
		if (!order.id || order.id.length <= 0) throw new BlError('order.id is not defined');
		if (!order.byCustomer) throw new BlError('order.byCustomer is false, no need to make dibs easy order');
		if (order.amount == 0) throw new BlError('order.amount is zero');
		
		
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
		dibsEasyItem.name = (orderItem.title) ? orderItem.title : "boklisten";
		dibsEasyItem.quantity = 1;
		dibsEasyItem.unit = "book";
		dibsEasyItem.unitPrice = this.toEars(orderItem.amount);
		dibsEasyItem.taxRate = (orderItem.taxRate) ? this.taxRate(orderItem.taxRate) : 0;
		dibsEasyItem.taxAmount = this.taxAmount(((orderItem.taxRate) ? orderItem.taxRate : 0), orderItem.amount);
		dibsEasyItem.grossTotalAmount = this.grossTotalAmount(orderItem.amount);
		dibsEasyItem.netTotalAmount = this.netTotalAmount(orderItem.taxRate, orderItem.amount);
		
		return dibsEasyItem;
	}
	
	private netTotalAmount(taxPercent: number, price: number): number {
		return this.grossTotalAmount(price) - this.taxAmount(taxPercent, price);
	}
	
	private grossTotalAmount(price: number): number {
		return this.toEars(price);
	}
	
	private taxAmount(taxPercent: number, price: number): number {
		return price * taxPercent;
	}
	
	private taxRate(taxPercent: number): number {
		if (taxPercent <= 0) return 0;
		
		return taxPercent * 100;
	}
	
	private toEars(price: number): number {
		return price * 100;
	}
}