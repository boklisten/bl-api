

import {Hook} from "../../../hook/hook";
import {AccessToken, Payment, BlError} from '@wizardcoder/bl-model';
import {BlDocumentStorage} from "../../../storage/blDocumentStorage";
import {paymentSchema} from "../../../../dist/collections/payment/payment.schema";

export class PaymentPatchHook extends Hook {
	private paymentStorage: BlDocumentStorage<Payment>;
	
	constructor(paymentStorage?: BlDocumentStorage<Payment>) {
		super();
		this.paymentStorage = (paymentStorage) ? paymentStorage : new BlDocumentStorage('payments', paymentSchema);
	}
	
	before(body: any, accessToken: AccessToken, id: string): Promise<boolean> {
		return Promise.resolve(true);
	}
	
	after(ids: string[], accessToken: AccessToken): Promise<boolean | Payment[]> {
		if (!ids || ids.length !== 1) {
			return Promise.reject(new BlError('ids are undefined'));
		}
		return new Promise((resolve, reject) => {
			this.paymentStorage.get(ids[0]).then((payment: Payment) => {
				if (payment.method === "later") {
					this.paymentStorage.update(payment.id, {confirmed: true}, {id: accessToken.sub, permission: accessToken.permission}).then((updatedPayment: Payment) => {
						resolve([updatedPayment]);
					}).catch((blError: BlError) => {
						reject(new BlError('could not update payment.confirmed to true when method is later').add(blError));
					});
				} else {
					resolve(true);
				}
			});
		});
	}
}