

import {UserGeneratorDevEnvironment} from "./user/user-generator.dev-environment";
import {BranchGeneratorDevEnvironment} from "./branch/branch-generator.dev-environment";
import {APP_CONFIG} from "../application-config";
import {CustomerItemGeneratorDevEnvironment} from "./customer-item/customer-item-generator.dev-environment";
import {InvoiceGeneratorDevEnvironment} from "./invoice/invoice-generator.dev-environment";

export class GeneratorDevEnvironment {

	constructor() {
		let branchGenerator = new BranchGeneratorDevEnvironment();
		let userGenerator = new UserGeneratorDevEnvironment();
		let customerItemGenerator = new CustomerItemGeneratorDevEnvironment();
		let invoiceGenerator = new InvoiceGeneratorDevEnvironment();

		this.mongoDbStart();

		userGenerator.clearDevData();
		branchGenerator.clearDevData();
		customerItemGenerator.clearDevData();
		invoiceGenerator.clearDevData();

		setTimeout(() => {
			branchGenerator.createDevData();

			setTimeout(() => {
				userGenerator.createDevData(branchGenerator.getBranchIds());

				setTimeout(() => {
					customerItemGenerator.createDevData(userGenerator.getUsers(), branchGenerator.getBranchIds(), userGenerator.getUserDetailConfig());

					setTimeout(() => {
						invoiceGenerator.createDevData(userGenerator.getUsers(), customerItemGenerator.getCustomerItems());
					}, 500);
				}, 500);
			}, 500);
		}, 500);
	}

	private mongoDbStart() {
		let mongoose = require('mongoose');
		mongoose.Promise = require('bluebird');
		mongoose.connect(this.getMongoDbPath(), {useMongoClient: true});
	}

	private getMongoDbPath(): string {
		return APP_CONFIG.dev.mongoDb.basePath + APP_CONFIG.dev.mongoDb.host + ':' + APP_CONFIG.dev.mongoDb.port + '/' + APP_CONFIG.dev.mongoDb.dbName;
	}
}

let gde = new GeneratorDevEnvironment();