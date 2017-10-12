import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {DbQueryRegexFilter} from "./db-query-regex-filter";

chai.use(chaiAsPromised);

describe('DbQueryRegexFilter', () => {
	let dbQueryRegexFilter: DbQueryRegexFilter = new DbQueryRegexFilter();

	describe('getRegexFilters()', () => {

		it('should throw error when searchString is empty', () => {
			expect(() => {
				dbQueryRegexFilter.getRegexFilters('', []);
			}).to.throw(ReferenceError);
		});


		it('should throw TypeError when search param is under 3 characters long', () => {
			expect(() => {
				dbQueryRegexFilter.getRegexFilters( 'si', ['name'])
			}).to.throw(TypeError)
		});

		it('should return empty array when validSearchParams is empty', () => {
			expect(dbQueryRegexFilter.getRegexFilters('hello', [])).to.eql([]);
		});

		it('should return array like [{name: {$regex: "sig", $options: "imx"}}]', () => {
			let result = [{fieldName: 'name', op: {$regex: 'sig', $options: 'imx'}}];
			expect(dbQueryRegexFilter.getRegexFilters('sig', ['name'])).to.eql(result);
		});

		it('should return array containing regexfilter objects for all params in validRegexParams', () => {
			let result = [
				{fieldName: 'name', op: {$regex: 'hello', $options: 'imx'}},
				{fieldName: 'message', op: {$regex: 'hello', $options: 'imx'}},
				{fieldName: 'info', op: {$regex: 'hello', $options: 'imx'}},
				{fieldName: 'desc', op: {$regex: 'hello', $options: 'imx'}},
			];

			let validRegexParams = ['name', 'message', 'info', 'desc'];
			let searchParam = 'hello';

			expect(dbQueryRegexFilter.getRegexFilters(searchParam, validRegexParams)).to.eql(result);

		});

	});
});