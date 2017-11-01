

import {UserGeneratorDevEnvironment} from "./user-generator.dev-environment";
import {BranchGeneratorDevEnvironment} from "./branch-generator.dev-environment";
import {APP_CONFIG} from "../application-config";

export class GeneratorDevEnvironment {

	constructor() {
		let branchGeneartor = new BranchGeneratorDevEnvironment();
		let userGenerator = new UserGeneratorDevEnvironment();

		this.mongoDbStart();

		userGenerator.clearDevData();
		branchGeneartor.clearDevData();

		setTimeout(() => {
			branchGeneartor.createDevData();

			setTimeout(() => {
				userGenerator.createDevData(branchGeneartor.getBranchIds());
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