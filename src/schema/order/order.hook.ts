

import {Hook} from "../../hook/hook";
import {BlError, CustomerItem, Item, Order, OrderItem, OrderPayment} from "bl-model";
import {SEDocument} from "../../db/model/se.document";
import {EndpointMongodb} from "../../endpoint/endpoint.mongodb";
import {OrderValidator} from "./order-validator/order-validator";

export class OrderHook extends Hook {
	
	constructor(private orderValidator: OrderValidator) {
		super();
	}

	public run(docs: SEDocument[]): Promise<boolean> {
		return new Promise((resolve, reject) => {
			if (!docs || docs.length <= 0) return reject(new BlError('no documents provided').code(701));
			
			this.validateDocs(docs).then(() => {
				
				return resolve(true);
				
			}).catch((err: BlError) => {
				return reject(new BlError('there was an error with the order data provided').code(701).add(err));
			})
		});
	}
	
	private validateDocs(docs: SEDocument[]): Promise<boolean> {
		return new Promise((resolve, reject) => {
			
			try {
				this.checkForMultiple(docs);
			} catch (err) {
				return reject(err);
			}
			
			let validatedOrders: Promise<boolean>[] = [];
			
			for (let doc of docs) {
				validatedOrders.push(this.validateData(doc));
			}
			
			Promise.all(validatedOrders).then(() => {
				console.log('we are done!');
				resolve(true);
			}).catch((err: BlError) => {
				reject(new BlError('the orders are not valid').code(701).add(err));
			})
		});
	}
	
	private validateData(doc: SEDocument): Promise<boolean> {
		return new Promise((resolve, reject) => {
			try {
				this.validateDocument(doc);
			} catch (err) {
				reject(new BlError('could not validate document'));
			}
			
			const order = doc.data as Order;
			
			
			this.orderValidator.validate(order).then(() => {
				resolve(true);
			}).catch((orderValidationError: BlError) => {
				reject(new BlError('order could not be validated').code(701).add(orderValidationError));
			});
		});
	}
	
	private checkForMultiple(docs: SEDocument[]): boolean {
		for (let i = 0; i < docs.length; i++) {
			for (let j = 0; j < docs.length; j++) {
				if (i != j) {
					if (docs[i].data === docs[j].data) throw new BlError('some of the docs provided are the same');
				}
			}
		}
		
		return true;
	}
	
	private validateDocument(doc: SEDocument): boolean {
		if (doc.documentName !== 'order') throw new BlError('document is not of valid type "order", it was "' + doc.documentName);
		if (!doc.data || this.isEmpty(doc.data)) throw new BlError('no data provided on document');
		return true;
	}
	
	private isEmpty(obj: any) {
		for (let x in obj) {
			return false;
		}
		return true;
	}
}