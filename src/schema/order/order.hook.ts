

import {Hook} from "../../hook/hook";
import {BlError, CustomerItem, Item, Order, OrderItem, OrderPayment} from "bl-model";
import {SEDocument} from "../../db/model/se.document";
import {EndpointMongodb} from "../../endpoint/endpoint.mongodb";
import {OrderValidator} from "./order-validator/order-validator";

export class OrderHook extends Hook {
	private orderValidator: OrderValidator;
	
	constructor(private itemMongo: EndpointMongodb, private customerItemMongo: EndpointMongodb, private branchMongo: EndpointMongodb) {
		super();
		this.orderValidator = new OrderValidator(itemMongo, customerItemMongo, branchMongo);
	}

	public async run(docs: SEDocument[]): Promise<boolean> {
		if (!docs || docs.length <= 0) return Promise.reject(new BlError('no documents provided'));
		
		for (let doc of docs) {
			
			try {
				this.validateDocument(doc);
			} catch (e) {
				return Promise.reject(new BlError('the document is not valid').add(e));
			}
			
			const order = doc.data as Order;
			
			this.orderValidator.validate(order).then(() => {
				
				console.log('the order was validated!!');
				
			}).catch((orderValidatorError: BlError) => {
				console.log('error when validating order..');
				orderValidatorError.printStack();
				return Promise.reject(new BlError('order could not be validated').code(701).add(orderValidatorError));
			});
		}
		return Promise.resolve(true);
	}
	
	private validateDocument(doc: SEDocument): boolean {
		if (doc.documentName !== 'order') throw new BlError('document is not of valid type "order", it was "' + doc.documentName);
		if (!doc.data) throw new BlError('no data provided on document');
		return true;
	}
}