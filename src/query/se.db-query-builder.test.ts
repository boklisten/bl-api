import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {SEDbQueryBuilder} from "./se.db-query-builder";
import {SEDbQuery} from "./se.db-query";
import {ValidParam} from "./valid-param/db-query-valid-params";

chai.use(chaiAsPromised);

describe('DbQueryBuilder', () => {

	describe('getDbQuery()', () => {
		let dbQueryBuilder: SEDbQueryBuilder = new SEDbQueryBuilder();

		it('should throw TypeError if query is null or empty', () => {
			expect(() => {
				dbQueryBuilder.getDbQuery({}, [{fieldName: 'name', type: 'string'}]);
			}).to.throw(TypeError);
		});

		it('should return SedbQuery with skip equal to 5', () => {
			let result = new SEDbQuery();
			result.skipFilter = {skip: 5};

			expect(dbQueryBuilder.getDbQuery({skip: '5'}, [])).to.eql(result);

		});

		it('should return SeDbQuery with limit to 4', () => {
			let result = new SEDbQuery();
			result.limitFilter = {limit: 4};
			expect(dbQueryBuilder.getDbQuery({limit: '4'}, [])).to.eql(result);
		});

		it('should return SeDbQuery with correct filters', () => {
			let result = new SEDbQuery();
			result.numberFilters = [
				{fieldName: 'age', op: {$gt: 12, $lt: 60}},
				{fieldName: 'price', op: {$eq: 120}}
			];

			result.limitFilter = {limit: 3};
			result.onlyGetFilters = [{fieldName: 'name', value: 1}];

			let validParams: ValidParam[] = [
				{fieldName: 'name', type: 'string'},
				{fieldName: 'age', type: 'number'},
				{fieldName: 'price', type: 'number'}
			];


			expect(dbQueryBuilder.getDbQuery({age: ['>12', '<60'], price: '120', limit: 3, og: 'name'}, validParams)).to.eql(result);
		});

		describe('getDbQuery() should throw type error', () => {
			it('should throw TypeError when limit is under 0', () => {

				expect(() => {
					dbQueryBuilder.getDbQuery({limit: '-6'}, [])
				}).to.throw(TypeError);

			});

			it('should throw TypeError when a number field is not a number', () => {
				expect(() => {
					dbQueryBuilder.getDbQuery({age: 'albert'}, [{fieldName: 'age', type: 'number'}]);
				}).to.Throw(TypeError);
			});


		});

		describe('getDbQuery() should throw ReferenceError', () => {
			it('should throw ReferenceError when a field is not in validQueryParams', () => {
				expect(() => {
					dbQueryBuilder.getDbQuery({og: ['name', 'age']}, [{fieldName: 'age', type: 'number'}])
				}).to.throw(ReferenceError);
			});

		});



	});
});