import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {BlError, Branch, Item, OrderItem} from "bl-model";
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
			rentRate: 0,
			taxRate: 0,
			taxAmount: 0,
			item: 'i1',
			amount: 100,
			type: "rent"
		};
		
		testBranch = {
			id: 'b1',
			name: 'testBranch',
			type: 'school',
			desc: '',
			root: true,
			childBranches: [''],
			items: [],
			openingHours: [],
			payment: {
				branchResponsible: false,
				rentPricePercentage: {
					base: 1.1,
					oneSemester: 1.1,
					twoSemesters: 1.2,
					buyout: 100
				},
				extendPrice: 100,
				acceptedMethods: []
			},
			comments: [],
			itemCategories: [],
			active: true,
			lastUpdated: new Date(),
			creationTime: new Date()
		}
	});
});