

import {BranchConfig} from "../../schema/branch/branch.config";
import {ItemConfig} from "../../schema/item/item.config";
import {SEDocument} from "../../db/model/se.document";
import {testDataBranches} from "./testdata-branch";
import {testDataItems} from "../item/testdata-item";
import {OpeningHourConfig} from "../../schema/opening-hour/opening-hour.config";
import {BlapiErrorResponse} from 'bl-model';

export class BranchGeneratorDevEnvironment {
	private insertedItems: any = [];
	private insertedBranches: any = [];
	private branchConfig: BranchConfig;
	private itemConfig: ItemConfig;
	private openingHourConfig: OpeningHourConfig;

	constructor() {
		this.branchConfig = new BranchConfig();
		this.itemConfig = new ItemConfig();
		this.openingHourConfig = new OpeningHourConfig();
	}

	public clearDevData() {
		console.log('\t* clearing old dev environment');

		this.branchConfig.schema.mongooseModel.remove({}, () => {
			console.log('\t\tbranch collection removed');
		});

		this.itemConfig.schema.mongooseModel.remove({} , () => {
			console.log('\t\titem collection removed');
		});

		this.openingHourConfig.schema.mongooseModel.remove({}, () => {
			console.log('\t\topeningHour collection removed');
		});
	}

	public createDevData() {
		console.log('\t* creating new dev environment');
		this.createBranchData();
		this.createItemData();

		setTimeout(() => {
			this.insertInitialDataToBranches();

			console.log('done\n');
		}, 1000);
	}

	public getBranchIds(): string[] {
		let branchIds: string[] = [];

		for (let branch of this.insertedBranches) {
			branchIds.push(branch._id);
		}

		return branchIds;
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

	private createOpeningHoursForBranch(branch: any) {
		this.openingHourConfig.schema.mongooseModel.insertMany(this.getRandomOpeningHours(branch._id)).then(
			(docs: any[]) => {
				let ids: string[] = [];
				for (let doc of docs) {
					ids.push(doc._id);
				}
				this.insertDataToBranch(branch, {openingHours: ids}).then(
					() => {

					},
					() => {
						console.log('! failed to add opening hours array to branch')
					});
			},
			() => {
				console.log('! failed on adding openingHours to branch');
			});
	}

	private getRandomOpeningHours(branchId: string): {from: Date, to: Date, branch: string}[] {
		let year = 2018;

		let dates: {from: Date, to: Date, branch: string}[] = [];
		let randomAmount = Math.floor((Math.random( ) * 15) + 1);

		for (let i = 0; i < randomAmount; i++) {
			let randomDate = this.getRandomDate();
			let randomHour = Math.floor((Math.random() * 16) + 7);
			let randomOpeningLenght = Math.floor((Math.random() * 10) + 1);
			let fromDate = new Date(year, randomDate.month, randomDate.day, randomHour);
			let toDate = new Date(year, randomDate.month, randomDate.day, randomHour + randomOpeningLenght);

			dates.push({from: fromDate, to: toDate, branch: branchId});

		}
		return dates;
	}

	private getRandomDate(): {day: number, month: number} {
		let day = Math.floor((Math.random() * 30) + 1);
		let month = Math.floor((Math.random() * 12) + 1);
		return {day: day, month: month};
	}

	private insertInitialDataToBranches() {
		for (let branch of this.insertedBranches) {

			this.insertDataToBranch(branch, {items: this.getRandomItems(this.insertedItems)}).then(
				() => {
					this.createOpeningHoursForBranch(branch);
				},
				(error: any) => {
					console.log('! error inserting items to branch', error);
				});
		}
		console.log('\t\tinserted initial items to branches');
		console.log('\t\tinserted initial opening-hours to branches');
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

	private insertDataToBranch(branch: any, data: any) {
		return new Promise((resolve, reject) => {
			this.branchConfig.schema.mongooseModel.update({_id: branch._id}, data).then(
				(docs: SEDocument[]) => {
					resolve(true);
				},
				(error: BlapiErrorResponse) => {
					reject(error);
				});
		});
	}


}
