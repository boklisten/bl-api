import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
import {expect} from 'chai';
import {BringDeliveryService} from "./bringDelivery.service";
import {HttpHandler} from "../../../../http/http.handler";
import {BlError, Item, DeliveryInfoBring} from "@wizardcoder/bl-model";
import {APP_CONFIG} from "../../../../application-config";

chai.use(chaiAsPromised);

describe('BringDeliveryService', () => {
	const httpHandler = new HttpHandler();
	const bringDeliveryService = new BringDeliveryService(httpHandler);
	
	let testBringResponse: any;
	
	let testItem: Item;
	
	beforeEach(() => {
		testItem = {
			id: 'item1',
			title: 'signatur 3',
			type: 'book',
			info: {},
			price: 100,
			taxRate: 0,
		};
		
		testBringResponse = {
			"@packageId": "0",
			"Product": [
				{
					"ProductId": "SERVICEPAKKE",
					"ProductCodeInProductionSystem": "1202",
					"GuiInformation": {
						"MainDisplayCategory": "Pakke",
						"DisplayName": "Klimanøytral Servicepakke",
						"ProductName": "Klimanøytral Servicepakke",
						"DescriptionText": "Pakken kan spores of utleveres p[ ditt lokale hentested.",
						"ProductUrl": "http://www.bring.no/send/pakker/private-i-norge/hentes-pa-posten",
						"DeliveryType": "Hentested"
					},
					"Price": {
						"@currencyIdentificationCode": "NOK",
						"PackagePriceWithoutAdditionalServices": {
							"AmountWithVAT": "165.00",
							"VAT": "33.00"
						},
						"PackagePriceWithAdditionalServices": {
							"AmountWithVAT": "165.00",
							"VAT": "33.00"
						}
					},
					"ExpectedDelivery": {
						"WorkingDays": "2",
						"UserMessage": null,
						"AlternativeDeliveryDates": null
					}
				}
			]
		};
	});
	
	sinon.stub(httpHandler, 'getWithQuery').callsFake((url: string, queryString: string, authorization?: string) => {
		return new Promise((resolve, reject) => {
		    if (url === APP_CONFIG.url.bring.shipmentInfo) {
		    	return resolve(testBringResponse);
			}
			
			return reject(new BlError('could not get requested data'));
		});
	});

	describe('#createBringDelivery()', () => {
		context('when input parameters are empty or undefined', () => {
		 	/*
			it('should reject if items is empty or undefined', (done) => {
				bringDeliveryService.getDeliveryInfoBring("1", "2", []).catch((blError) => {
					expect(blError.getMsg())
						.to.contain('items is empty or undefined');
					done();
				});
			});
			*/
			/*
			it('should reject if fromPostalCode is empty or undefined', (done) => {
				bringDeliveryService.getDeliveryInfoBring("", "2", [testItem])
					.catch((blError) => {
						expect(blError.getMsg())
							.to.contain('fromPostalCode is empty or undefined')
						done();
					})
			});
			*/
			/*
			it('should reject if toPostalCode is empty or undefined', (done) => {
				/*
				bringDeliveryService.getDeliveryInfoBring("1", null, [testItem])
					.catch((blError) => {
						expect(blError.getMsg())
							.to.contain('toPostalCode is empty or undefined')
						done();
					});
			});
			*/
		});
		
		
		context('when bring resolves with a correct response', () => {
			/*
			it('should resolve with deliveyInfoBring.amount equal to 165.00', (done) => {
				bringDeliveryService.getDeliveryInfoBring("0560", "7070", [testItem]).then((deliveryInfoBring: DeliveryInfoBring) => {
					expect(deliveryInfoBring.amount)
						.to.eql(165.00);
					done();
				})
			});
			*/
		});
	});
});