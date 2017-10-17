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
import {SeCrypto} from "../crypto/se.crypto";
import {Employee} from "../config/schema/employee/employee";

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
	seCrypto: SeCrypto;

	constructor(router: Router, userConfig: EndpointConfig, customerConfig: EndpointConfig,
	            employeeConfig: EndpointConfig, resHandler: SEResponseHandler) {
		this.router = router;
		this.userConfig = userConfig;
		this.customerConfig = customerConfig;
		this.employeeConfig = employeeConfig;
		this.basePath = 'api';
		this.seCrypto = new SeCrypto();

		this.userEndpointMongoDb = new EndpointMongodb(this.userConfig.schema);
		this.customerEndpointMongoDb = new EndpointMongodb(this.customerConfig.schema);
		this.employeeEndpointMongoDb = new EndpointMongodb(this.employeeConfig.schema);

		this.resHandler = resHandler;
		this.seQuery = new SEDbQueryBuilder();

		this.createCustomerPost(router);
		this.createEmployeePost(router);
	}

	private createCustomerPost(router: Router) {
		router.post(this.createPath('customers'), (req: Request, res: Response) => {
			if (!this.validateBody(req.body)) {
				this.resHandler.sendErrorResponse(res, new SEErrorResponse(400));
				return;
			}

			let customer = req.body as Customer;

			this.checkIfEmailExistsAndReturnEncryptedEmail(customer.email).then(
				(encryptedEmail: string) => {
					this.createCustomer(customer).then(
						(customerDoc: SEDocument) => {
							let customerData = customerDoc.data;
							this.createUser("customer", customerData._id, encryptedEmail).then(
								(user: User) => {
									this.resHandler.sendResponse(res, new SEResponse([customerDoc]));
								},
								(error) => {
									this.resHandler.sendErrorResponse(res, error);
								});
						},
						(error: SEErrorResponse) => {
							this.resHandler.sendErrorResponse(res, error);
						});
				},
				(error: SEErrorResponse) => {
					this.resHandler.sendErrorResponse(res, error);
				});
		});
	}

	private createEmployeePost(router: Router) {
		router.post(this.createPath('employees'), (req: Request, res: Response) => {
			if (!this.validateBody(req.body)) {
				this.resHandler.sendErrorResponse(res, new SEErrorResponse(400));
				return;
			}

			let employee = req.body as Employee;


			this.checkIfEmailExistsAndReturnEncryptedEmail(employee.email).then(
				(encryptedEmail: string) => {
					this.createEmployee(employee).then(
						(employeeDoc: SEDocument) => {
							let employeeData = employeeDoc.data;
							this.createUser('employee', employeeData._id, encryptedEmail).then(
								(user: User) => {
									this.resHandler.sendResponse(res, new SEResponse([employeeDoc]));
								},
								(error: SEErrorResponse) => {
									this.resHandler.sendErrorResponse(res, error);
								}
							)
						},
						(error: SEErrorResponse) => {
							this.resHandler.sendErrorResponse(res, error);
						}
					)
				},
				(error: SEErrorResponse) => {
					this.resHandler.sendErrorResponse(res, error);
				}
			)
		})
	}

	private checkIfEmailExistsAndReturnEncryptedEmail(email: string): Promise<string> {
		return new Promise((resolve, reject) => {
		    this.seCrypto.chiper(email).then(
				(encryptedEmail: string) => {

					let dbQuery = new SEDbQuery();
					dbQuery.stringFilters = [{fieldName: 'emailToken', value: encryptedEmail}];

					this.userEndpointMongoDb.exists(dbQuery).then(
						(exists: boolean) => {
							if (exists) {
								reject(new SEErrorResponse(400, 'email exists'));
							} else {
								resolve(encryptedEmail);
							}
						},
						(error: SEErrorResponse) => {
							reject(error);
						});
				},
			    (error: SEErrorResponse) => {
					reject(error);
			    });
		});
	}

	private createCustomer(customer: Customer): Promise<SEDocument> {
		return new Promise((resolve, reject) => {
			this.customerEndpointMongoDb.post(new SEDocument(this.customerConfig.collectionName, customer)).then(
				(docs: SEDocument[]) => {
					resolve(docs[0]);
				},
				(error: SEErrorResponse) => {
					reject(error);
				});
		});
	}

	private createEmployee(employee: Employee): Promise<SEDocument> {
		return new Promise((resolve, reject) => {
		    this.employeeEndpointMongoDb.post(new SEDocument(this.employeeConfig.collectionName, employee)).then(
			    (docs: SEDocument[]) => {
			    	resolve(docs[0]);
			    },
			    (error: SEErrorResponse) => {
			    	reject(error);
			    });
		});
	}

	private createUser(userType: "customer" | "employee", userDetailId: string, emailToken: string): Promise<User> {
		return new Promise((resolve, reject) => {
			let permissionLevel = 1;

			if (userType === 'employee') permissionLevel = 2;

			let user: User = {
				userType: userType,
				userDetail: userDetailId,
				permissionLevel: permissionLevel,
				emailToken: emailToken
			};

			this.userEndpointMongoDb.post(new SEDocument('user', user)).then(
				(docs: SEDocument[]) => {
					resolve(user);
				},
				(error) => {
					reject(error);
				});
		});
	}

	private validateBody(body: any): boolean {
		if (!body) return false;
		if (!body.email) return false;
		return true;
	}

	private createPath(path: string): string {
    	let thePath = '/' + this.basePath + '/' + path;
        return thePath;
    }

    private createPathWithId(path: string): string {
		return this.createPath(path) + '/:id';
    }
}