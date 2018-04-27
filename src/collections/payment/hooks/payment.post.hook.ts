

import {Hook} from "../../../hook/hook";
import {BlDocument, BlError, Order, Payment, AccessToken} from "@wizardcoder/bl-model";
import {BlDocumentStorage} from "../../../storage/blDocumentStorage";
import {paymentSchema} from "../payment.schema";
import {DibsPaymentService} from "../../../payment/dibs/dibs-payment.service";
import {DibsEasyOrder} from "../../../payment/dibs/dibs-easy-order/dibs-easy-order";
import {SystemUser} from "../../../auth/permission/permission.service";
import {orderSchema} from "../../order/order.schema";
import {PaymentValidator} from "../helpers/payment.validator";
import {isNullOrUndefined} from "util";
import {PaymentDibsHandler} from "../helpers/dibs/payment-dibs-handler";

export class PaymentPostHook extends Hook {
	
	private paymentStorage: BlDocumentStorage<Payment>;
	private orderStorage: BlDocumentStorage<Order>;
	private paymentValidator: PaymentValidator;
	private paymentDibsHandler: PaymentDibsHandler;
	
	constructor(paymentStorage?: BlDocumentStorage<Payment>, orderStorage?: BlDocumentStorage<Order>, paymentValidator?: PaymentValidator,
				paymentDibsHandler?: PaymentDibsHandler) {
		super();
		this.paymentValidator = (paymentValidator) ? paymentValidator : new PaymentValidator();
		this.paymentStorage = (paymentStorage) ? paymentStorage : new BlDocumentStorage('payments', paymentSchema);
		this.orderStorage = (orderStorage) ? orderStorage : new BlDocumentStorage('orders', orderSchema);
		this.paymentDibsHandler = (paymentDibsHandler) ? paymentDibsHandler : new PaymentDibsHandler();
	}
	
	public before(): Promise<boolean> {
		return new Promise((resolve, reject) => {
			resolve(true);
		});
	}
	
	public after(ids: string[], accessToken: AccessToken): Promise<boolean | BlDocument[]> {
		return new Promise((resolve, reject) => {
			if (!ids || ids.length != 1) {
				reject(new BlError('ids is empty or undefined').store('ids', ids));
			}
			
			if (isNullOrUndefined(accessToken)) {
				reject(new BlError('accessToken is undefined'));
			}
			
			this.paymentStorage.get(ids[0]).then((payment: Payment) => {
				this.paymentValidator.validate(payment).then(() => {
					switch (payment.method) {
						case "dibs":
							return this.paymentDibsHandler.handleDibsPayment(payment, accessToken).then((payment) => {
								return resolve([payment]);
							}).catch((blError: BlError) => {
								reject(blError);
							});
						default:
							break;
					}
				}).catch((blError: BlError) => {
					reject(new BlError('payment could not be validated').add(blError));
				})
			}).catch((blError: BlError) => {
				reject(new BlError('payment id not found').add(blError));
			});
		});
	}
}

