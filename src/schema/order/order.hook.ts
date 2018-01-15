

import {Hook} from "../../hook/hook";
import {HookConfig} from "../../hook/hook.config";
import {BlDocument, BlError, Item, Order, OrderItem} from "bl-model";
import {SEDocument} from "../../db/model/se.document";
import {EmailHandler, EmailTemplateInput} from "bl-email";
import {SECRETS} from "../../config/secrets";
import {EMAIL_TEMPLATE_CONFIG} from "../../config/email/emailTemplateConfig";
import {EndpointExpress} from "../../endpoint/endpoint.express";
import {EndpointMongodb} from "../../endpoint/endpoint.mongodb";

export class OrderHook extends Hook {
	
	constructor(private itemMongo: EndpointMongodb, private customerItemMongo: EndpointMongodb) {
		super();
	}

	public run(docs: SEDocument[]): Promise<boolean> {
		
		const emailItems = [];
		
		
		for (let doc of docs) {
			const order = doc.data as Order;
			
			
		}
	/*
		const emailHandler: EmailHandler = new EmailHandler({sendgrid: {apiKey: SECRETS.email.sendgrid.apiKey}});
		const emailTemplateInput: EmailTemplateInput = {
			toEmail: "aholskil@gmail.com",
			emailType: "receipt",
			items: [
				{
					status: "ordered",
					title: "Signa"
				}
			]
		};
		//emailHandler.send(EMAIL_TEMPLATE_CONFIG, )
		
		//return Promise.resolve(true);
		*/
		return Promise.resolve(true);
	}



	private validateOrderItems(orderItems: OrderItem[]): boolean {
		for (let orderItem of orderItems) {
			if (orderItem.type === "rent") {
				if (!orderItem.customerItem) return false
			}
		}
	}
	
	private haveTypeRent(orderItems: OrderItem[]): boolean {
		for (let orderItem of orderItems) {
			if (orderItem.type === 'rent') return true;
		}
		return false;
	}
	
	private getEmailItems(orderItems: OrderItem[]): Promise<{title: string, status: string, price: number, deadline: string}> {
		return new Promise((resolve, reject) => {
			
			let orderItemIds = [];
			let emailItemsMid = [];
	
			let customerItemIds = [];
			
			for (let orderItem of orderItems) {
				orderItemIds.push(orderItem.item);
				
				emailItemsMid[orderItem.item] = {price: orderItem.amount};
				
				if (orderItem.customerItem) {
					customerItemIds.push(orderItem.customerItem);
				}
			}
			
			this.itemMongo.getManyById(orderItemIds).then((oiDocs: SEDocument[]) => {
				for (let oidoc of oiDocs) {
					const item = oidoc.data as Item;
					emailItemsMid[item.id] = {price: emailItemsMid[item.id].price, title: item.title};
				}
			}).catch((oiDocError: BlError) => {
				console.log('there was an error..', oiDocError);
			});
			
			if (this.haveTypeRent(orderItems)) {
				this.customerItemMongo.getManyById(customerItemIds).then((ciDocs: SEDocument[]) => {
					console.log('we got some customerItems!', ciDocs);
				}).catch((ciDocError: BlError) => {
					console.log('there was an error getting customerItems...', ciDocError);
				})
			}
			
		});
	}
}