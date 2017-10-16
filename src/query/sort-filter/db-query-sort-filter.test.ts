import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {DbQuerySortFilter} from "./db-query-sort-filter";

chai.use(chaiAsPromised);

describe('DbQuerySortFilter', () => {

	describe('getSortFilter()', () => {
		let dbQuerySortFilter: DbQuerySortFilter = new DbQuerySortFilter();

		it('should throw TypeError when query is null or empty', () => {
			expect(() => {
				dbQuerySortFilter.getSortFilters({}, ['hello']);
			}).to.throw(TypeError);
		});

		it('should return empty array if query does not have the sort object', () => {
			expect(dbQuerySortFilter.getSortFilters({name: "hello"}, ['age'])).to.eql([]);
		});

		it('should throw ReferenceError if none of the sort params are in the ValidSortParams', () => {
			expect(() => {
				dbQuerySortFilter.getSortFilters({sort: ['-age', 'name']}, ['desc']);
			}).to.throw(ReferenceError);
		});

		it('should return correct array with the given input', () => {
			let result = [
				{fieldName: 'name', direction: 1},
				{fieldName: 'age', direction: -1}
			];

			expect(dbQuerySortFilter.getSortFilters({sort: ['name', '-age']}, ['name', 'age'])).to.eql(result);
		});
	});
});