import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {DbQueryLimitFilter} from "./db-query-limit-filter";

chai.use(chaiAsPromised);

describe('DbQueryLimitFilter', () => {

	describe('getLimitFilter()', () => {
		let dbQueryLimitFilter = new DbQueryLimitFilter();

		it('should throw error if query is empty or null', () => {
			expect(() => {
				dbQueryLimitFilter.getLimitFilter({});
			}).to.throw(TypeError);
		});

		it('should return {limit: 0} if no limit is found in query', () => {
			expect(dbQueryLimitFilter.getLimitFilter({name: 'Albert'})).to.eql({limit: 0});
		});

		it('should throw TypeError if limit is not a valid number', () => {
			expect(() => {
				dbQueryLimitFilter.getLimitFilter({limit: 'not a number'});
			}).to.throw(TypeError);
		});

	});
});