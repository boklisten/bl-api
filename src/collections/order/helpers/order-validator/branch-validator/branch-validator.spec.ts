import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {BlError, Branch, Item, OrderItem} from "@wizardcoder/bl-model";
import {BranchValidator} from "./branch-validator";

chai.use(chaiAsPromised);

describe('BranchValidator', () => {
	let testOrderItem: OrderItem;
	let testBranch: Branch;
	const branchValidator: BranchValidator = new BranchValidator();
	
	beforeEach(() => {
		testOrderItem = {
			title: "signatur 3",
			unitPrice: 200,
			taxRate: 0,
			taxAmount: 0,
			item: 'i1',
			amount: 100,
			type: "rent"
		};
		
		testBranch = {
			id: 'branch1',
			name: 'Sonans',
			paymentInfo: {
				responsible: false,
				rentPeriods: [
					{
						type: "semester",
						maxNumberOfPeriods: 2,
						percentage: 0.5
					}
				],
				extendPeriods: [
					{
						type: "semester",
						price: 100,
						maxNumberOfPeriods: 1
					}
				],
				buyout: {
					percentage: 0.50
				},
				acceptedMethods: ['card']
			}
		}
	});
});