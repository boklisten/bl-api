

import {Order} from 'bl-model';

export class OrderItemValidator {
	
	constructor() {
	
	}
	
	
	public validate(order: Order): Promise<boolean> {
		return Promise.reject('not implemented');
	}
}