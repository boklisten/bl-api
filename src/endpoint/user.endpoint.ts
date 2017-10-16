import {EndpointConfig} from "./endpoint.express";
import {EndpointMongodb} from "./endpoint.mongodb";
import {SEResponseHandler} from "../response/se.response.handler";
import {SEDbQueryBuilder} from "../query/se.db-query-builder";

import {Router, Request, Response} from 'express';
import {SEDocument} from "../db/model/se.document";
import {SEErrorResponse} from "../response/se.error.response";
import {SEResponse} from "../response/se.response";

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
						this.customerEndpointMongoDb.getById(user.userDetail).then(
							(docs: SEDocument[]) => {
								this.resHandler.sendResponse(res, new SEResponse(docs));
							},
							(error: SEErrorResponse) => {
								this.resHandler.sendErrorResponse(res, error);
							}
						)
					} else if (user.userType === 'employee') {
						this.employeeEndpointMongoDb.getById(user.userDetail).then(
							(docs: SEDocument[]) => {
								this.resHandler.sendResponse(res, new SEResponse(docs));
							},
							(error: SEErrorResponse) => {
								this.resHandler.sendErrorResponse(res, error);
							});
					} else {
						this.resHandler.sendErrorResponse(res, new SEErrorResponse(403));
					}
				},
				(error: SEErrorResponse) => {
					this.resHandler.sendErrorResponse(res, error);
				});
		})

	}

	getUser() {

	}

	getCustomer() {

	}

	createPath(path: string): string {
    	let thePath = '/' + this.basePath + '/' + path;
        return thePath;
    }

    createPathWithId(path: string): string {
		return this.createPath(path) + '/:id';
    }


}