

import {Router} from "express";
import {PaymentCollection} from "./payment/payment.collection";
import {DeliveryCollection} from "./delivery/delivery.collection";
import {BlCollectionGenerator} from "./bl-collection-generator";
import {Payment, Delivery} from 'bl-model';
import chalk from "chalk";

export class BlEndpointCreator {
	
	constructor(private router: Router) {
	
	}
	
	createAll() {
		console.log('\t' + chalk.blue('# ') + chalk.gray('endpoints:'));
		const paymentCollectionGenerator = new BlCollectionGenerator<Payment>(this.router, new PaymentCollection());
		const deliveryCollectionGenerator = new BlCollectionGenerator<Delivery>(this.router, new DeliveryCollection());
		
		paymentCollectionGenerator.generate();
		deliveryCollectionGenerator.generate();
	}
}