
import {
	Order,
	CustomerItem,
	OrderItem,
	BlError,
	AccessToken,
	Payment,
	UserDetail,
	Delivery
} from '@wizardcoder/bl-model';
import {BlDocumentStorage} from "../../../../storage/blDocumentStorage";
import {customerItemSchema} from "../../../customer-item/customer-item.schema";
import {orderSchema} from "../../order.schema";
import {PaymentHandler} from "../../../payment/helpers/payment-handler";
import {userDetailSchema} from "../../../user-detail/user-detail.schema";
import {EmailService} from "../../../../messenger/email/email-service";
import {deliverySchema} from "../../../delivery/delivery.schema";
import {Messenger} from "../../../../messenger/messenger";
import {CustomerItemHandler} from "../../../customer-item/helpers/customer-item-handler";
import {OrderItemMovedFromOrderHandler} from "../order-item-moved-from-order-handler/order-item-moved-from-order-handler";
import {isNullOrUndefined} from "util";

export class OrderPlacedHandler {
	private customerItemStorage: BlDocumentStorage<CustomerItem>;
	private orderStorage: BlDocumentStorage<Order>;
	private paymentHandler: PaymentHandler;
	private userDetailStorage: BlDocumentStorage<UserDetail>;
	private _customerItemHandler: CustomerItemHandler;
	private _orderItemMovedFromOrderHandler: OrderItemMovedFromOrderHandler;
	private _messenger: Messenger;
	
	constructor(customerItemStorage?: BlDocumentStorage<CustomerItem>,
				orderStorage?: BlDocumentStorage<Order>,
				paymentHandler?: PaymentHandler,
				userDetailStorage?: BlDocumentStorage<UserDetail>,
				messenger?: Messenger,
				customerItemHandler?: CustomerItemHandler,
				orderItemMovedFromOrderHandler?: OrderItemMovedFromOrderHandler) {
		this.customerItemStorage = (customerItemStorage) ? customerItemStorage : new BlDocumentStorage('customeritems', customerItemSchema);
		this.orderStorage = (orderStorage) ? orderStorage : new BlDocumentStorage('orders', orderSchema);
		this.paymentHandler = (paymentHandler) ? paymentHandler : new PaymentHandler();
		this.userDetailStorage = (userDetailStorage) ? userDetailStorage : new BlDocumentStorage('userdetails', userDetailSchema);
		this._messenger = (messenger) ? messenger : new Messenger();
		this._customerItemHandler = (customerItemHandler) ? customerItemHandler : new CustomerItemHandler();
		this._orderItemMovedFromOrderHandler = (orderItemMovedFromOrderHandler) ? orderItemMovedFromOrderHandler : new OrderItemMovedFromOrderHandler();
	}
	
	public async placeOrder(order: Order, accessToken: AccessToken): Promise<Order> {
		try {
			if (!isNullOrUndefined(order.customer)) {
				let userDetail = await this.userDetailStorage.get(order.customer);

				if (!userDetail.emailConfirmed) {
					throw new BlError('userDetail.emailConfirmed is not true');
				}
			}

			await this.paymentHandler.confirmPayments(order, accessToken);

			const placedOrder = await this.orderStorage.update(order.id, {placed: true}, {
				id: accessToken.sub,
				permission: accessToken.permission
			});

			await this.updateCustomerItemsIfPresent(placedOrder);
			await this._orderItemMovedFromOrderHandler.updateOrderItems(placedOrder);
			await this.updateUserDetailWithPlacedOrder(placedOrder, accessToken);
			this.sendOrderConfirmationMail(placedOrder);
			return placedOrder;
		} catch (e) {
			throw new BlError('could not update order').add(e);
		}
	}

	private async updateCustomerItemsIfPresent(order: Order): Promise<Order> {
		try {
			for (let orderItem of order.orderItems) {
				if (orderItem.type === 'extend' || orderItem.type === 'buyout') {
					let customerItemId = null;

					if (orderItem.info && orderItem.info.customerItem) {
						customerItemId = orderItem.info.customerItem;
					} else if (orderItem.customerItem) {
						customerItemId = orderItem.customerItem;
					}

					if (customerItemId !== null) {
						if (orderItem.type === 'extend') {
							await this._customerItemHandler.extend(customerItemId, orderItem, order.branch);
						} else if (orderItem.type === 'buyout') {
							await this._customerItemHandler.buyout(customerItemId, order.id, orderItem);
						}
					}
				}
			}

			return Promise.resolve(order);
		} catch (e) {
			throw e;
		}
	}

	private updateUserDetailWithPlacedOrder(order: Order, accessToken: AccessToken): Promise<boolean> {
		if (isNullOrUndefined(order.customer) || !order.customer) {
			return Promise.resolve(true);
		}
		return new Promise((resolve, reject) => {
			this.userDetailStorage.get(order.customer).then((userDetail: UserDetail) => {
				let orders = (userDetail.orders) ? userDetail.orders : [];
				if (orders.indexOf(order.id) <= -1) {
					orders.push(order.id);

					this.userDetailStorage.update(order.customer, {orders: orders}, {id: accessToken.sub, permission: accessToken.permission}).then((updatedUserDetail: UserDetail) => {
						resolve(true);
					}).catch((updateUserDetailError: BlError) => {
						reject(new BlError('could not update userDetail with placed order'));
					});
				} else {
					reject(new BlError('the order was already in userDetails'));
				}
			}).catch((getUserDetailError: BlError) => {
				reject(new BlError(`customer "${order.customer}" not found`).add(getUserDetailError));
			});
		});
	}

	private updateLastOrderItemsIfMovedFromOrder(order: Order, accessToken: AccessToken): Promise<boolean> {
		return new Promise((resolve, reject) => {
			let movedFromOrderItems: {itemId: string, movedFromOrderId: string, movedToOrderId: string}[] = [];

			reject(new Error(''));
		});
	}

	private sendOrderConfirmationMail(order: Order) {
		this.userDetailStorage.get(order.customer).then((customerDetail: UserDetail) => {

			if (order.handoutByDelivery) {
				this._messenger.sendDeliveryInformation(customerDetail, order);
			} else {
				this._messenger.orderPlaced(customerDetail, order);
			}

		}).catch((getCustomerDetailError) => {

		})
	}
}