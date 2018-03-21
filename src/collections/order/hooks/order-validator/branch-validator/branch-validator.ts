
import {BlError, Branch, OrderItem} from "bl-model";

import {Order} from 'bl-model';

export class BranchValidator {
	
	constructor() {
	
	}
	
	public validate(order: Order): Promise<boolean> {
		return Promise.resolve(true);
	}
}