import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {SEDbQuery} from "./se.db-query";

chai.use(chaiAsPromised);

describe('SEDbQuery', () => {

	describe('getFilter()', () => {
		let dbQuery: SEDbQuery = new SEDbQuery();

		it('should return a object containing all number, boolean, string and regex filters', () => {
			dbQuery.booleanFilters = [{fieldName: 'isHungry', value: true}, {fieldName: 'haveCar', value: false}];
			dbQuery.stringFilters = [{fieldName: 'name', value: 'Bob Marley'}];
			dbQuery.numberFilters = [
				{fieldName: 'age', op: {$eq: 20}},
			];
			dbQuery.regexFilters = [
				{fieldName: 'desc', op: {$regex: 'balloon', $options: 'imx'}}
			];

			let result = {
				isHungry: true,
				haveCar: false,
				name: 'Bob Marley',
				age: {$eq: 20},
				desc: {$regex: 'balloon', $options: 'imx'}
			};

			expect(dbQuery.getFilter()).to.eql(result);
		});
	});

	describe('getOgFilter()', () => {
		it('should return correct ogFilterObj based on ogFilter array', () => {
			let dbQuery: SEDbQuery = new SEDbQuery();

			dbQuery.onlyGetFilters = [
				{fieldName: 'name', value: 1},
				{fieldName: 'age', value: 1}
			];

			let result = {
				name: 1,
				age: 1
			};

			expect(dbQuery.getOgFilter()).to.eql(result);
		});

	});

	describe('getSortFilter()', () => {
		it('should return correct sortFilter object based on sortFilter array', () => {
			let dbQuery: SEDbQuery = new SEDbQuery();

			dbQuery.sortFilters = [
				{fieldName: 'age', direction: 1},
				{fieldName: 'name', direction: -1}
			];

			let result = {age: 1, name: -1};

			expect(dbQuery.getSortFilter()).to.eql(result);
		});

	});
});
