
import {UserConfig} from "../../config/schema/user/user.config";
import {UserDetailConfig} from "../../config/schema/user/user-detail.config";
import {Blid} from "../../auth/blid/blid";
import {testDataUsers} from "./testdata-user";
import {testDataUserDetails} from "./testdata-user-detail";

export class UserGeneratorDevEnvironment {
	userConfig: UserConfig;
	userDetailConfig: UserDetailConfig;
	blid: Blid;
	branchIds: string[];
	insertedUsers: any[];

	constructor() {
		this.userConfig = new UserConfig();
		this.userDetailConfig = new UserDetailConfig();
		this.blid = new Blid();
		this.insertedUsers = [];
	}

	public clearDevData() {
		this.userConfig.schema.mongooseModel.remove({}, () => {
			console.log('\t\tremoved user collection')
		});

		this.userDetailConfig.schema.mongooseModel.remove({}, () => {
			console.log('\t\tremoved userDetail collection');
		});
	}

	public createDevData(branchIds: string[]) {
		this.branchIds = branchIds;
		this.createUsers();
	}

	public getUserIds(): string[] {
		let userIds: string[] = [];

		for (let user of this.insertedUsers) {
			userIds.push(user._id);
		}


		return userIds;
	}

	public getUsers(): any[] {
		return this.insertedUsers;
	}

	public getUserDetailConfig(): UserDetailConfig {
		return this.userDetailConfig;
	}

	private createUsers() {
		console.log('\t* creating users');

		for (let i = 0; i < testDataUsers.length; i++) {
			let user = testDataUsers[i];

			this.blid.createUserBlid(user.login.provider, user.login.providerId).then(
				(blid: string) => {
					user.blid = blid;
				},
				() => {
					console.log('! could not create blid for user');
				});

			let userDetail = testDataUserDetails[i];
			userDetail.branch = this.branchIds[Math.floor((Math.random() * this.branchIds.length))];

			this.userDetailConfig.schema.mongooseModel.insertMany([testDataUserDetails[i]]).then(
				(docs: any[]) => {
					user.userDetail = docs[0]._id;
					user.username = docs[0].name;
					this.addUser(user);
				},
				(error: any) => {
					console.log('! could not create userDetail for user');
				});
		}
	}

	private addUser(user: any) {
		this.userConfig.schema.mongooseModel.insertMany([user]).then(
			(docs: any[]) => {
				console.log('\t\tadded user', docs[0].username);
				this.insertedUsers.push(docs[0]);
			},
			(error: any) => {
				console.log('! could not create user');
			});
	}
}
