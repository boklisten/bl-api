import {Request, Router} from "express";
import {SEResponseHandler} from "../response/se.response.handler";
import {
	BlDocument,
	Branch, BranchItem,
	CustomerItem,
	Delivery,
	Item,
	OpeningHour,
	Order,
	Payment,
	UserDetail
} from "@wizardcoder/bl-model";

import {ItemCollection} from "../collections/item/item.collection";
import {CustomerItemCollection} from "../collections/customer-item/customer-item.collection";
import {CollectionEndpoint} from "./collection-endpoint";
import chalk from "chalk";
import {BranchCollection} from "../collections/branch/branch.collection";
import {UserDetailCollection} from "../collections/user-detail/user-detail.collection";
import {DeliveryCollection} from "../collections/delivery/delivery.collection";
import {OpeningHourCollection} from "../collections/opening-hour/opening-hour.collection";
import {OrderCollection} from "../collections/order/order.collection";
import {PaymentCollection} from "../collections/payment/payment.collection";
import {BlErrorLog} from "../collections/bl-error-log/bl-error-log";
import {BlErrorLogCollection} from "../collections/bl-error-log/bl-error-log.collection";
import {BranchItemCollection} from "../collections/branch-item/branch-item.collection";
import {PasswordReset} from "../collections/password-reset/password-reset";
import {PasswordResetCollection} from "../collections/password-reset/password-reset.collection";

export class CollectionEndpointCreator {
	private _responseHandler: SEResponseHandler;

	constructor(private _router: Router) {
		this._responseHandler = new SEResponseHandler();
	}

	create() {
		const collectionEndpoints: CollectionEndpoint<BlDocument>[] = [
			new CollectionEndpoint<Branch>(this._router, new BranchCollection(), this._responseHandler),
			new CollectionEndpoint<BranchItem>(this._router, new BranchItemCollection(), this._responseHandler),
			new CollectionEndpoint<CustomerItem>(this._router, new CustomerItemCollection(), this._responseHandler),
			new CollectionEndpoint<Delivery>(this._router, new DeliveryCollection(), this._responseHandler),
			new CollectionEndpoint<Item>(this._router, new ItemCollection(), this._responseHandler),
			new CollectionEndpoint<OpeningHour>(this._router, new OpeningHourCollection(), this._responseHandler),
			new CollectionEndpoint<Order>(this._router, new OrderCollection(), this._responseHandler),
			new CollectionEndpoint<Payment>(this._router, new PaymentCollection(), this._responseHandler),
			new CollectionEndpoint<UserDetail>(this._router, new UserDetailCollection(), this._responseHandler),
			new CollectionEndpoint<BlErrorLog>(this._router, new BlErrorLogCollection(), this._responseHandler),
			new CollectionEndpoint<PasswordReset>(this._router, new PasswordResetCollection(), this._responseHandler)
		];

		console.log(`\t${chalk.blue('#')} ${chalk.gray('endpoints:')}`);

		for (const collectionEndpoint of collectionEndpoints) {
			collectionEndpoint.create();
			collectionEndpoint.printEndpoints();
			console.log('');
		}
	}
}