

import {Router} from "express";
import {PaymentCollection} from "./payment/payment.collection";
import {DeliveryCollection} from "./delivery/delivery.collection";
import {BlCollectionGenerator} from "./bl-collection-generator";
import {Payment, Delivery, Branch, Item, CustomerItem, OpeningHour, UserDetail, Order} from 'bl-model';
import chalk from "chalk";
import {BranchCollection} from "./branch/branch.collection";
import {ItemCollection} from "./item/item.collection";
import {CustomerItemCollection} from "./customer-item/customer-item.collection";
import {OpeningHourCollection} from "./opening-hour/opening-hour.collection";
import {UserDetailCollection} from "./user-detail/user-detail.collection";
import {OrderCollection} from "./order/order.collection";

export class BlEndpointCreator {
	
	constructor(private router: Router) {
	
	}
	
	createAll() {
		console.log('\t' + chalk.blue('# ') + chalk.gray('endpoints:'));
		
		const paymentCollectionGenerator = new BlCollectionGenerator<Payment>(this.router, new PaymentCollection());
		const deliveryCollectionGenerator = new BlCollectionGenerator<Delivery>(this.router, new DeliveryCollection());
		const branchCollectionGenerator = new BlCollectionGenerator<Branch>(this.router, new BranchCollection());
		const itemCollectionGenerator = new BlCollectionGenerator<Item>(this.router, new ItemCollection());
		const customerItemCollectionGenerator = new BlCollectionGenerator<CustomerItem>(this.router, new CustomerItemCollection());
		const openingHourCollectionGenerator = new BlCollectionGenerator<OpeningHour>(this.router, new OpeningHourCollection());
		const userDetailCollectionGenerator = new BlCollectionGenerator<UserDetail>(this.router, new UserDetailCollection());
		const orderCollectionGenerator = new BlCollectionGenerator<Order>(this.router, new OrderCollection());
		
		paymentCollectionGenerator.generate();
		deliveryCollectionGenerator.generate();
		branchCollectionGenerator.generate();
		itemCollectionGenerator.generate();
		customerItemCollectionGenerator.generate();
		openingHourCollectionGenerator.generate();
		userDetailCollectionGenerator.generate();
		orderCollectionGenerator.generate();
	}
}