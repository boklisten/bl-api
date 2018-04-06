
import {Order} from '@wizardcoder/bl-model';

export class BranchValidator {
	
	constructor() {
	
	}
	
	public validate(order: Order): Promise<boolean> {
		return Promise.resolve(true);
	}
}