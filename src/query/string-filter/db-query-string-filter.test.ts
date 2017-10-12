import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {DbQueryStringFilter} from "./db-query-string-filter";

chai.use(chaiAsPromised);

describe('DbQueryStringFilter', () => {
	let dbQueryStringFilter: DbQueryStringFilter = new DbQueryStringFilter();

	describe('getStringFilters() on empty data', () => {

		it('should return empty array if query is valid and validStringParams is empty', () => {
			expect(dbQueryStringFilter.getStringFilters({name: 'testerman'}, [])).to.eql([]);
		});

		it('should throw TypeError if query is empty', () => {
			expect(() => {
				dbQueryStringFilter.getStringFilters({}, ['name']);
			}).to.throw(TypeError);
		});

		it('should throw error when both query and validParams are empty ', () => {
			expect(() => {
				dbQueryStringFilter.getStringFilters({}, []);
			}).to.throw(TypeError);
		});
	});

	describe('getStringFilters() when data is not valid', () => {
		it('should throw TypeError if parameter is not a valid string', () => {
			expect(() => {
				dbQueryStringFilter.getStringFilters({name: {test: {}}}, ['name']);
			}).to.throw(TypeError);
		});

	});

	describe('getStringFilters() when data is valid', () => {
		it('should not change values in query that are not in ValidStringParams', () => {
			let result = [{name: 'albert'}];
			expect(dbQueryStringFilter.getStringFilters({name: 'albert', phone: '123'}, ['name'])).to.eql(result);
		});

		it('should return correct array given valid input', () => {
			let query = {name: 'billy bob', desc: 'hello there this is bob', age: '10'};
			let result = [{name: 'billy bob'}, {desc: 'hello there this is bob'}];
			expect(dbQueryStringFilter.getStringFilters(query, ['name', 'desc', 'title'])).to.eql(result);

		});
	});
});