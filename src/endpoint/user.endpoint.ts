import {EndpointConfig} from "./endpoint.express";
import {EndpointMongodb} from "./endpoint.mongodb";
import {SEResponseHandler} from "../response/se.response.handler";
import {SEDbQueryBuilder} from "../query/se.db-query-builder";

import {Router, Request, Response} from 'express';
import {SEDocument} from "../db/model/se.document";
import {SEErrorResponse} from "../response/se.error.response";
import {SEResponse} from "../response/se.response";
import {User} from "../config/schema/user/user";
import {Customer} from "../config/schema/customer/customer";
import {SEDbQuery} from "../query/se.db-query";
const crypto = require('crypto');

export class UserEndpoint {
	router: Router;
	userConfig: EndpointConfig;
	employeeConfig: EndpointConfig;
	customerConfig: EndpointConfig;

	basePath: string;
	userEndpointMongoDb: EndpointMongodb;
	employeeEndpointMongoDb: EndpointMongodb;
	customerEndpointMongoDb: EndpointMongodb;

	resHandler: SEResponseHandler;
	seQuery: SEDbQueryBuilder;

	constructor(router: Router, userConfig: EndpointConfig, customerConfig: EndpointConfig,
	            employeeConfig: EndpointConfig, resHandler: SEResponseHandler) {
		this.router = router;
		this.userConfig = userConfig;
		this.customerConfig = customerConfig;
		this.employeeConfig = employeeConfig;
		this.basePath = 'api';

		this.userEndpointMongoDb = new EndpointMongodb(this.userConfig.schema);
		this.customerEndpointMongoDb = new EndpointMongodb(this.customerConfig.schema);
		this.employeeEndpointMongoDb = new EndpointMongodb(this.employeeConfig.schema);

		this.resHandler = resHandler;
		this.seQuery = new SEDbQueryBuilder();

		this.createGet(router);
		this.createPost(router);
		this.createCustomerPost(router);

	}

	createMethods(router: Router) {

	}

	createGet(router: Router) {

		router.get(this.createPathWithId('users'), (req: Request, res: Response) => {
			console.log('we have a request to user', req.params.id);

			this.userEndpointMongoDb.getById(req.params.id).then(
				(docs: SEDocument[]) => {

					let user = docs[0].data;

					if (user.userType === 'customer') {
						this.getCustomer(res, user.userDetail);
					} else if (user.userType === 'employee') {
						this.getEmployee(res, user.userDetail);
					} else {
						this.resHandler.sendErrorResponse(res, new SEErrorResponse(403));
					}
				},
				(error: SEErrorResponse) => {
					this.resHandler.sendErrorResponse(res, error);
				});
		});
	}

	createPost(router: Router) {
		router.post(this.createPath('users'), (req: Request, res: Response) => {
			console.log(req.body);
			let user = req.body as User;

			if (user.userType === 'customer') {
				res.send('is customer');
			} else if (user.userType === 'employee') {
				res.send('is employee');
			} else {
				this.resHandler.sendErrorResponse(res, new SEErrorResponse(403));
			}
		});
	}

	private createCustomerPost(router: Router) {
		router.post(this.createPath('customers'), (req: Request, res: Response) => {
			let customer = req.body as Customer;

			let emailCipher = crypto.createCipher('aes192', customer.email);

			let encryptedEmail = '';
			/*

			emailCipher.on('readable', () => {
				const data = emailCipher.read();
				if (data) {
					encryptedEmail += data.toString('hex');
				}
			});

			emailCipher.on('end', () => {
				console.log('encrypted', encryptedEmail);
				res.send('hello');
			});

			emailCipher.end();
*/

			/*

			let emailToken = crypto.createHash('sha256', customer.email);

			console.log('emailToken:::::::::', emailToken);

			let dbQuery = new SEDbQuery();
			dbQuery.stringFilters = [{fieldName: 'emailToken', value: emailToken}];

			this.userEndpointMongoDb.exists(dbQuery).then(
				(exists: boolean) => {
					if (exists) {
						console.log('email exists!, cant create customer');
						this.resHandler.sendErrorResponse(res, new SEErrorResponse(400));
					} else {
						console.log('email does not exist, creating customer');
						this.createCustomer(res, customer);
					}
				}
			)


			this.createCustomer(res, req.body);
			*/
		});
	}

	private createCustomer(res: Response, customer: Customer) {


		this.customerEndpointMongoDb.post(new SEDocument(this.customerConfig.collectionName, customer)).then(
			(docs: SEDocument[]) => {
				console.log('the docs are', docs);
			},
			(error: SEErrorResponse) => {
				this.resHandler.sendErrorResponse(res, error);
			});
	}

	getUser() {

	}

	private getCustomer(res: Response, customerId: string) {
		this.customerEndpointMongoDb.getById(customerId).then(
			(docs: SEDocument[]) => {
				this.resHandler.sendResponse(res, new SEResponse(docs));
			},
			(error: SEErrorResponse) => {
				this.resHandler.sendErrorResponse(res, error);
			});
	}

	private getEmployee(res: Response, employeeId: string) {
		this.customerEndpointMongoDb.getById(employeeId).then(
			(docs: SEDocument[]) => {
				this.resHandler.sendResponse(res, new SEResponse(docs));
			},
			(error: SEErrorResponse) => {
				this.resHandler.sendErrorResponse(res, error);
			});
	}

	private createPath(path: string): string {
    	let thePath = '/' + this.basePath + '/' + path;
        return thePath;
    }

    private createPathWithId(path: string): string {
		return this.createPath(path) + '/:id';
    }


}