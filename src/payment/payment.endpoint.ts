


import {Request, Response, Router} from "express";
import {APP_CONFIG} from "../application-config";
import * as passport from "passport";
import {SEResponseHandler} from "../response/se.response.handler";
import {DibsPayment} from "./dibs/dibs-payment";
import {ApiPath} from "../config/api-path";
import {OrderValidator} from "../schema/order/order-validator/order-validator";
import {EndpointMongodb} from "../endpoint/endpoint.mongodb";
import {BlapiResponse, BlError, Order} from "bl-model";
import {SESchema} from "../config/schema/se.schema";
import {OrderSchema} from "../schema/order/order.schema";
import {SEDocument} from "../db/model/se.document";
import {DibsEasyOrder} from "./dibs/dibs-easy-order/dibs-easy-order";

export class PaymentEndpoint {
	
	private apiPath: ApiPath;
	private orderValidator: OrderValidator;
	private dibsPayment: DibsPayment;
	private orderMongo: EndpointMongodb;
	
	constructor(private router: Router, private resHandler: SEResponseHandler,
				itemMongo: EndpointMongodb, branchMongo: EndpointMongodb) {
		this.apiPath = new ApiPath();
		this.dibsPayment = new DibsPayment();
		this.orderMongo = new EndpointMongodb(new SESchema('orders', OrderSchema));
		this.orderValidator = new OrderValidator(itemMongo, branchMongo);
		
		
		
		
		this.createGetDibsPaymentIdEndpoint();
	}
	
	createPostPayment() {
	}
	
	createGetDibsPaymentIdEndpoint() {
		
		this.router.post(this.apiPath.createPath('payment/dibs'), (req: Request, res: Response, next) => {
			passport.authenticate('jwt', (err, user, info) => {
				if (!user || err || !user.accessToken) {
					return this.resHandler.sendAuthErrorResponse(res, info, err);
				}
				
				let order = req.body as Order;
				
				this.orderValidator.validate(order).then(() => {
					
					this.orderMongo.post(new SEDocument('order', order)).then((docs: SEDocument[]) => {
						if (docs.length !== 1) {
							return this.resHandler.sendErrorResponse(res, new BlError('bad format'));
						}
						
						let addedOrder: Order = docs[0].data as Order;
						let deo: DibsEasyOrder;
						
						try {
							deo = this.dibsPayment.orderToDibsEasyOrder(addedOrder);
						} catch (err) {
							if (err instanceof BlError) {
								return this.resHandler.sendErrorResponse(res, err);
							}
							
							return this.resHandler.sendErrorResponse(res, new BlError('unkown error: could not make dibsEasyOrder based on order').store('order', addedOrder));
						}
						
						
						this.dibsPayment.getPaymentId(deo).then((paymentId: string) => {
							return this.resHandler.sendResponse(res, new BlapiResponse([{paymentId: paymentId}]))
						}).catch((blError: BlError) => {
							return this.resHandler.sendErrorResponse(res, new BlError('failed to get payment id from dibs').add(blError));
						});
					}).catch((blError: BlError) => {
						return this.resHandler.sendErrorResponse(res, blError);
					
					})
				}).catch((blError: BlError) => {
					return this.resHandler.sendErrorResponse(res, blError);
				});
				
				
				
				
				
				
			})(req, res, next);
		})
	}
}