

import {Order} from "bl-model";
import {DibsEasyOrder} from "./dibs/dibs-easy-order/dibs-easy-order";
import {Router} from "express";
import {SEResponseHandler} from "../response/se.response.handler";
import {PaymentEndpoint} from "./payment.endpoint";
import {EndpointMongodb} from "../endpoint/endpoint.mongodb";
import {SESchema} from "../config/schema/se.schema";
import {ItemSchema} from "../schema/item/item.schema";
import {BranchSchema} from "../schema/branch/branch.schema";

export class PaymentModule {
	
	
	constructor(private router: Router, private resHandler: SEResponseHandler) {
		let itemMongo = new EndpointMongodb(new SESchema('items', ItemSchema));
		let branchMongo = new EndpointMongodb(new SESchema('branches', BranchSchema));
		let paymentEndpoint = new PaymentEndpoint(router, resHandler, itemMongo, branchMongo);
	}
	
}