

import {Order} from "bl-model";
import {DibsEasyOrder} from "./dibs/dibs-easy-order/dibs-easy-order";

export class Payment {
	
	
	constructor() {
	
	}
	
	
	
	
	
	private toEars(price: number): number {
		return price * 1000;
	}
}