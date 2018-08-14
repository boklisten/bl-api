

import {AccessToken, BlError, Order, Payment} from "@wizardcoder/bl-model";
import {BlDocumentStorage} from "../../../storage/blDocumentStorage";
import {paymentSchema} from "../payment.schema";
import {DibsPaymentService} from "../../../payment/dibs/dibs-payment.service";
import {DibsEasyPayment} from "../../../payment/dibs/dibs-easy-payment/dibs-easy-payment";
import {isNullOrUndefined} from "util";
import {UserDetailHelper} from "../../user-detail/helpers/user-detail.helper";

export class PaymentHandler {
	private paymentStorage: BlDocumentStorage<Payment>;
	private dibsPaymentService: DibsPaymentService;
	private _userDetailHelper: UserDetailHelper;
	
	constructor(paymentStorage?: BlDocumentStorage<Payment>, dibsPaymentService?: DibsPaymentService, userDetailHelper?: UserDetailHelper) {
		this.paymentStorage = (paymentStorage) ? paymentStorage : new BlDocumentStorage('payments', paymentSchema);
		this.dibsPaymentService = (dibsPaymentService) ? dibsPaymentService : new DibsPaymentService();
		this._userDetailHelper = (userDetailHelper) ? userDetailHelper : new UserDetailHelper();
	}
	
	public async confirmPayments(order: Order, accessToken: AccessToken): Promise<Payment[]> {
		if (!order.payments || order.payments.length <= 0) {
			return [];
		}

		let payments: Payment[];

		try{
			payments = await this.paymentStorage.getMany(order.payments);
		} catch (e) {
			throw new BlError('one or more payments was not found');
		}


		for (let payment of payments) {
			if (payment.confirmed) {
				throw new BlError(`payment "${payment.id}" is already confirmed`);
			}
		}

		if (payments.length > 1) {
			await this.confirmMultiplePayments(order, payments, accessToken);
		} else {
			await this.confirmBasedOnPaymentMethod(order, payments[0], accessToken);

			let updatedPayment = await this.paymentStorage.update(payments[0].id, {confirmed: true}, {
				id: accessToken.sub,
				permission: accessToken.permission
			});
			return [updatedPayment];
		}
	}

	private async confirmMultiplePayments(order: Order, payments: Payment[], accessToken: AccessToken): Promise<boolean> {
		if (payments.length > 1) {
			for (let payment of payments) {
				if (payment.method === 'dibs') {
					return Promise.reject(new BlError(`there was multiple payments but only one is allowed if one has method "${payment.method}"`));
				} else {
					if (this.confirmBasedOnPaymentMethod(order, payment, accessToken)) {
						await this.paymentStorage.update(payment.id, {confirmed: true}, {id: accessToken.sub, permission: accessToken.permission});
					}
				}
			}
		}
	}
	
	private confirmBasedOnPaymentMethod(order: Order, payment: Payment, accessToken: AccessToken): Promise<boolean> {
		switch (payment.method) {
			case 'dibs':
				return this.confirmMethodDibs(order, payment, accessToken);
			case 'card':
				return this.confirmMethodCard(order, payment);
			case 'cash':
				return this.confirmMethodCash(order, payment);
			case 'vipps':
				return this.confirmMethodVipps(order, payment);
			default:
				return Promise.reject(new BlError(`payment method "${payment.method}" not supported`));
		}
	}

	private confirmMethodCard(order: Order, payment: Payment): Promise<boolean> {
		return Promise.resolve(true);
	}

	private confirmMethodVipps(order: Order, payment: Payment): Promise<boolean> {
		return Promise.resolve(true);
	}

	private confirmMethodCash(order: Order, payment: Payment): Promise<boolean> {
		return Promise.resolve(true);
	}
	
	
	private confirmMethodDibs(order: Order, payment: Payment, accessToken: AccessToken): Promise<boolean> {
		return new Promise((resolve, reject) => {
			if (isNullOrUndefined(payment.info)) {
				return reject(new BlError('payment.method is "dibs" but payment.info is undefined'));
			}
			
			if (isNullOrUndefined(payment.info['paymentId'])) {
				return reject(new BlError('payment.method is "dibs" but payment.info.paymentId is undefined'))
			}
			
			this.dibsPaymentService.fetchDibsPaymentData(payment.info['paymentId']).then((dibsEasyPayment: DibsEasyPayment) => {
				if (isNullOrUndefined(dibsEasyPayment.orderDetails)) {
					reject(new BlError('dibsEasyPayment was found, but dibsEasyPayment.orderDetails was undefined').store('dibsEasyPayment', dibsEasyPayment).store('orderDetails', dibsEasyPayment['orderDetails']));
				}
				
				if (dibsEasyPayment.orderDetails.reference !== order.id) {
					reject(new BlError('dibsEasyPayment.orderDetails.reference is not equal to order.id').store('dibsEasyPayment', dibsEasyPayment))
				}
				
				if (isNullOrUndefined(dibsEasyPayment.summary)) {
					reject(new BlError('dibsEasyPayment.summary is undefined').store('dibsEasyPayment', dibsEasyPayment));
				}
				
				if (isNullOrUndefined(dibsEasyPayment.summary.reservedAmount)) {
					reject(new BlError('dibsEasyPayment.summary.reservedAmount is undefined').store('dibsEasyPayment', dibsEasyPayment));
				}
				
				if (dibsEasyPayment.summary.reservedAmount !== (payment.amount * 100)) {
					reject(new BlError(`dibsEasyPayment.summary.reservedAmount "${dibsEasyPayment.summary.reservedAmount}" is not equal to payment.amount "${(payment.amount * 100)}"`).store('dibsEasyPayment', dibsEasyPayment));
				}

				this.paymentStorage.update(payment.id, {info: dibsEasyPayment}, {id: accessToken.sub, permission: accessToken.permission}).then((updatedPayment: Payment) => {
					this._userDetailHelper.updateUserDetailBasedOnDibsEasyPayment(payment.customer, updatedPayment.info as DibsEasyPayment, accessToken).then(() => {
						resolve(true);
					}).catch((updateUserDetailError: BlError) => {
						reject(new BlError('could not update user details based on dibsEasyPayment')
							.store('userDetailId', payment.customer)
							.store('paymentId', payment.id)
							.add(updateUserDetailError));
					})

				}).catch((updatePaymentError: BlError) => {
					reject(new BlError('could not update payment with DibsEasyPayment').add(updatePaymentError));
				});

			}).catch((getDibsPaymentError: BlError) => {
				reject(new BlError('could not get dibs payment on dibs api').add(getDibsPaymentError));
			})
		});
	}

}