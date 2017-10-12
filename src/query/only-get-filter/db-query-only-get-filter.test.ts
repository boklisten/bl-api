import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {DbQueryOnlyGetFilter} from "./db-query-only-get-filter";

chai.use(chaiAsPromised);

describe('DbQueryOnlyGetFilter', () => {

	describe('getOnlyGetFilters()', () => {
		let dbQueryOnlyGetFilter: DbQueryOnlyGetFilter = new DbQueryOnlyGetFilter();

		it('should throw TypeError if query is null or empty', () => {
			expect(() => {
				dbQueryOnlyGetFilter.getOnlyGetFilters({}, ['name']);
			}).to.throw(TypeError);
		});

		it('should return empty array if validOnlyGetParams is empty', () => {
			expect(dbQueryOnlyGetFilter.getOnlyGetFilters({og: 'name'}, [])).to.eql([]);
		});

		it('should return array with correct onlyGet fields', () => {
			let result = [
				{fieldName: 'name'},
				{fieldName: 'age'}
			];

			expect(dbQueryOnlyGetFilter.getOnlyGetFilters({og: ['name', 'age']}, ['name', 'age', 'desc'])).to.eql(result);
		});

		it('should throw ReferenceError if a parameter in onlyGet is not in validOnlyGetParams', () => {
			expect(() => {
				dbQueryOnlyGetFilter.getOnlyGetFilters({og: 'age'}, ['name']);
			}).to.throw(ReferenceError);
		});
	});
});