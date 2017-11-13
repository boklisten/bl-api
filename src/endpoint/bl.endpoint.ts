
import {Router} from "express";
import {EndpointExpress} from "./endpoint.express";
import {SEResponseHandler} from "../response/se.response.handler";
import {ItemConfig} from "../schema/item/item.config";
import {BranchConfig} from "../schema/branch/branch.config";
import {CustomerItemConfig} from "../schema/customer-item/customer-item.config";
import {OrderConfig} from "../schema/order/order.config";
import {OrderItemConfig} from "../schema/orderItem/order-item.config";
import {InvoiceConfig} from "../schema/invoice/invoice.config";
import {InvoiceItemConfig} from "../schema/invoice-tem/invoice-item.config";
import {OpeningHourConfig} from "../schema/opening-hour/opening-hour.config";

export class BlEndpoint {
	private branchEndpoint: EndpointExpress;
	private customerItemEndpoint: EndpointExpress;
	private itemEndpoint: EndpointExpress;
	private orderEndpoint: EndpointExpress;
	private orderItemEndpoint: EndpointExpress;
	private invoiceEndpoint: EndpointExpress;
	private invoiceItemEndpoint: EndpointExpress;
	private openingHourEndpoint: EndpointExpress;

	constructor(router: Router) {
		let resHandler = new SEResponseHandler();
		this.branchEndpoint = new EndpointExpress(router, new BranchConfig(), resHandler);
		this.customerItemEndpoint = new EndpointExpress(router, new CustomerItemConfig(), resHandler);
		this.itemEndpoint = new EndpointExpress(router, new ItemConfig(), resHandler);
		this.orderEndpoint = new EndpointExpress(router, new OrderConfig(), resHandler);
		this.orderItemEndpoint = new EndpointExpress(router, new OrderItemConfig(), resHandler);
		this.invoiceEndpoint = new EndpointExpress(router, new InvoiceConfig(), resHandler);
		this.invoiceItemEndpoint = new EndpointExpress(router, new InvoiceItemConfig(), resHandler);
		this.openingHourEndpoint = new EndpointExpress(router, new OpeningHourConfig(), resHandler);
	}
}