

import {BranchConfig} from "../schema/branch/branch.config";
import {CustomerItemConfig} from "../schema/customer-item/customer-item.config";
import {ItemConfig} from "../schema/item/item.config";
import {OrderItemConfig} from "../schema/orderItem/order-item.config";
import {OrderConfig} from "../schema/order/order.config";
import {EndpointMongodb} from "../endpoint/endpoint.mongodb";
import {SEDocument} from "../db/model/se.document";
import {testDataBranches} from "./branch/testdata-branch";
import {SEErrorResponse} from "../response/se.error.response";
import {APP_CONFIG} from "../application-config";
import {testDataItems} from "./item/testdata-item";

export class TestdataInsert {
	private insertedItems: any = [];
	private insertedBranches: any = [];
	private branchMongoDb: EndpointMongodb;
	private branchConfig: BranchConfig;
	private itemConfig: ItemConfig;

	constructor() {
		this.branchConfig = new BranchConfig();
		this.itemConfig = new ItemConfig();
		let customerItemConfig = new CustomerItemConfig();
		let orderItemConfig = new OrderItemConfig();
		let orderConfig = new OrderConfig();


		console.log('\ncreating dev environment');


		this.mongoDbStart();

		this.clearDevEnviroment();

		setTimeout(() => {
			this.createDevEnviornment();
		}, 500);



	}

	private clearDevEnviroment() {
		console.log('\t* clearing old dev environment');

		this.branchConfig.schema.mongooseModel.remove({}, () => {
			console.log('\t\tbranch collection removed');
		});

		this.itemConfig.schema.mongooseModel.remove({} , () => {
			console.log('\t\titem collection removed');
		});
	}

	private createDevEnviornment() {
		console.log('\t* creating new dev environment');
		this.createBranchData();
		this.createItemData();

		setTimeout(() => {
			this.insertInitialDataToBranches();
			console.log('\t\tinserted initial item ids to branches');
			console.log('done\n');
		}, 1000);


	}

	private createBranchData() {
		this.branchConfig.schema.mongooseModel.insertMany(testDataBranches).then(
			(docs: any[]) => {
				for (let doc of docs) {
					this.insertedBranches.push(doc);
				}
				console.log('\t\tinserted ' + this.insertedBranches.length + ' branches');
			},
			() => {
				console.log('! failed to insert branch data');
			});
	}

	private createItemData() {
		this.itemConfig.schema.mongooseModel.insertMany(testDataItems).then(
			(docs: any[]) => {
				for (let doc of docs) {
					this.insertedItems.push(doc);
				}
				console.log('\t\tinserted ' + this.insertedItems.length + ' items');
			},
			() => {
				console.log('! failed to insert item data');
			});
	}

	private insertInitialDataToBranches() {
		for (let branch of this.insertedBranches) {

			this.insertItemsToBranch(branch, this.getRandomItems(this.insertedItems)).then(
				() => {

				},
				(error: any) => {
					console.log('! error inserting items to branch', error);
				});
		}
	}

	private getRandomItems(items: any[]): string[] {
		let itemIds: string[] = [];
		let randomAmount = Math.floor((Math.random() * items.length) + 1);


		let current = 0;
		while (current < randomAmount) {
			let randomItem = Math.floor(Math.random() * items.length);
			while (itemIds.indexOf(items[randomItem]._id) > -1) {
				randomItem = Math.floor(Math.random() * items.length);
			}
			itemIds.push(items[randomItem]._id);
			current++;
		}

		return itemIds;
	}

	private insertItemsToBranch(branch: any, items: string[]) {
		return new Promise((resolve, reject) => {
			this.branchConfig.schema.mongooseModel.update({_id: branch._id}, {items: items}).then(
				(docs: SEDocument[]) => {
					resolve(true);
				},
				(error: SEErrorResponse) => {
					reject(error);
				});
		});
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

let testdataIndert = new TestdataInsert();