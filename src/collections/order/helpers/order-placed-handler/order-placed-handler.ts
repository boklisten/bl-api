
import {Order, CustomerItem, OrderItem, BlError, AccessToken, Payment, UserDetail} from '@wizardcoder/bl-model';
import {BlDocumentStorage} from "../../../../storage/blDocumentStorage";
import {customerItemSchema} from "../../../customer-item/customer-item.schema";
import {orderSchema} from "../../order.schema";
import {PaymentHandler} from "../../../payment/helpers/payment-handler";
import {userDetailSchema} from "../../../user-detail/user-detail.schema";

export class OrderPlacedHandler {
	private customerItemStorage: BlDocumentStorage<CustomerItem>;
	private orderStorage: BlDocumentStorage<Order>;
	private paymentHandler: PaymentHandler;
	private userDetailStorage: BlDocumentStorage<UserDetail>;
	
	constructor(customerItemStorage?: BlDocumentStorage<CustomerItem>, orderStorage?: BlDocumentStorage<Order>, paymentHandler?: PaymentHandler, userDetailStorage?: BlDocumentStorage<UserDetail>) {
		this.customerItemStorage = (customerItemStorage) ? customerItemStorage : new BlDocumentStorage('customeritems', customerItemSchema);
		this.orderStorage = (orderStorage) ? orderStorage : new BlDocumentStorage('orders', orderSchema);
		this.paymentHandler = (paymentHandler) ? paymentHandler : new PaymentHandler();
		this.userDetailStorage = (userDetailStorage) ? userDetailStorage : new BlDocumentStorage('userdetails', userDetailSchema);
	}
	
	public placeOrder(order: Order, accessToken: AccessToken): Promise<Order> {
		return new Promise((resolve, reject) => {
			this.paymentHandler.confirmPayments(order, accessToken).then((confirmedPayments: Payment[]) => {
				this.orderStorage.update(order.id, {placed: true}, {id: accessToken.sub, permission: accessToken.permission}).then((placedOrder: Order) => {
					this.updateUserDetailWithPlacedOrder(placedOrder, accessToken).then(() => {
						resolve(placedOrder);
					}).catch((updateUserDetailError: BlError) => {
						reject(updateUserDetailError);
					});
				}).catch((orderUpdateError: BlError) => {
					reject(new BlError('order could not be updated').add(orderUpdateError));
				})
			}).catch((confirmPaymentsError: BlError) => {
				reject(new BlError('order.payments could not be confirmed').add(confirmPaymentsError));
			});
		});
	}
	
	private updateUserDetailWithPlacedOrder(order: Order, accessToken: AccessToken): Promise<boolean> {
		return new Promise((resolve, reject) => {
			this.userDetailStorage.get(accessToken.details).then((userDetail: UserDetail) => {
				let orders = (userDetail.orders) ? userDetail.orders : [];
				orders.push(order.id);
				
				this.userDetailStorage.update(userDetail.id, {orders: orders}, {id: accessToken.sub, permission: accessToken.permission}).then((updatedUserDetail: UserDetail) => {
					resolve(true);
				}).catch((updateUserDetailError: BlError) => {
					reject(new BlError('could not update userDetail with placed order'));
				});
			}).catch((getUserDetailError: BlError) => {
				reject(new BlError(`userDetail "${accessToken.details}" not found`).add(getUserDetailError));
			});
		});
	}
}