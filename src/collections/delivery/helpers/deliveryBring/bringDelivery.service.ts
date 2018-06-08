

import {BlError, DeliveryInfoBring, Item} from "@wizardcoder/bl-model";
import {HttpHandler} from "../../../../http/http.handler";
import {BringDelivery} from "./bringDelivery";
import moment = require("moment");
import {APP_CONFIG} from "../../../../application-config";
import {isNullOrUndefined} from "util";

export type ShipmentAddress = {
	name: string;
	postalCode: string;
	postalCity: string;
	address: string;
};

export type FacilityAddress = {
	address: string;
	postalCode: string;
	postalCity: string;
}

export class BringDeliveryService {
	private httpHandler: HttpHandler;
	private bringShipmentUrl: string;
	private clientUrl: string;
	
	constructor(httpHandler?: HttpHandler) {
		this.httpHandler = (httpHandler) ? httpHandler : new HttpHandler();
		this.bringShipmentUrl = APP_CONFIG.url.bring.shipmentInfo;
		this.clientUrl = APP_CONFIG.url.blWeb.base;
	}
	
	public getDeliveryInfoBring(facilityAddress: FacilityAddress, shipmentAddress: ShipmentAddress, items: Item[]): Promise<DeliveryInfoBring> {
		if (isNullOrUndefined(facilityAddress) || isNullOrUndefined(shipmentAddress)) {
			return Promise.reject(new BlError('required fields facilityAddress or shipmentAddress are null or undefined'));
		}
		if (!items || items.length <= 0) {
			return Promise.reject(new BlError('items is empty or undefined'));
		}
		
		if (!facilityAddress.postalCode || shipmentAddress.postalCode.length <= 0) {
			return Promise.reject(new BlError('fromPostalCode is empty or undefined'));
		}
		
		if (!shipmentAddress.postalCode || shipmentAddress.postalCode.length <= 0) {
			return Promise.reject(new BlError('toPostalCode is empty or undefined'));
		}
		
		
		return new Promise((resolve, reject) => {
		    let bringDelivery = this.createBringDelivery(facilityAddress, shipmentAddress, items);
		    let queryString = this.httpHandler.createQueryString(bringDelivery);
		   
		    this.httpHandler.getWithQuery(this.bringShipmentUrl, queryString).then((responseData: any) => {
		    	
		    	let deliveryInfoBring: DeliveryInfoBring;
		    	
		    	try {
					deliveryInfoBring = this.getDeliveryInfoBringFromBringResponse(facilityAddress, shipmentAddress, responseData);
				} catch(e) {
		    		if (e instanceof BlError) {
		    			return reject(e);
					}
					return reject(new BlError('unkown error, could not parse the data from bring api').store('error', e));
				}
				
		    	resolve(deliveryInfoBring);
			}).catch((blError: BlError) => {
		    	return reject(blError);
			})
		    
		});
	}
	
	private createBringDelivery(facilityAddress: FacilityAddress, shipmentAddress: ShipmentAddress, items: Item[]): BringDelivery {
		let bringDelivery: BringDelivery;

		let totalWeight = 0;

		for (const item of items) {
			if (item.info && item.info['weight']) {
				totalWeight += parseInt(item.info['weight']);
			} else {
				totalWeight += 500;
			}
		}
		
		bringDelivery = {
			clientUrl: this.clientUrl,
			weightInGrams: totalWeight,
			from: facilityAddress.postalCode,
			to: shipmentAddress.postalCode
		};
		
		return bringDelivery;
	}
	
	private getDeliveryInfoBringFromBringResponse(facilityAddress: FacilityAddress, shipmentAddress: ShipmentAddress, responseData: any): DeliveryInfoBring {
		let deliveryInfoBring: DeliveryInfoBring = {
			amount: -1,
			estimatedDelivery: new Date(),
			taxAmount: 0,
			facilityAddress: facilityAddress,
			shipmentAddress: shipmentAddress,
			from: facilityAddress.postalCode,
			to: shipmentAddress.postalCode
		};
		
		if (!responseData['Product']) {
			throw new BlError('no products provided in response from bringApi');
		}
		
		for (let product of responseData['Product']) {
			if (product['ProductId'] === 'SERVICEPAKKE') {
				
				let priceInfo = product['Price'];
				let priceWithoutAdditionalService = priceInfo['PackagePriceWithoutAdditionalServices'];
				if (priceWithoutAdditionalService) {
					deliveryInfoBring.amount = parseInt(priceWithoutAdditionalService['AmountWithVAT']);
					deliveryInfoBring.taxAmount = parseInt(priceWithoutAdditionalService['VAT']);
				}
				
				let expectedDelivery = product['ExpectedDelivery'];
				if (expectedDelivery) {
					let workingDays = expectedDelivery['WorkingDays'];
					if (workingDays) {
						deliveryInfoBring.estimatedDelivery = moment().add(workingDays, 'days').toDate();
					}
				}
			}
			
		}
		
		if (deliveryInfoBring.amount === -1) {
			throw new BlError('could not parse the data from the bring api').store('responseData', responseData);
		}
		
		return deliveryInfoBring;
	}
}