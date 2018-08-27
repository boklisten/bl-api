import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {BlError} from '@wizardcoder/bl-model';
import {DbQueryDateFilter} from "./db-query-date-filter";
import moment = require("moment");

chai.use(chaiAsPromised);

describe('DbQueryDateFilter', () => {
	const dbQueryDateFilter: DbQueryDateFilter = new DbQueryDateFilter();
	const validDateFormat = 'DDMMYYYYHHmm';

	describe('#getDateFilters', () => {

		it('should throw TypeError if parameters are empty', () => {
			expect(() => {
				dbQueryDateFilter.getDateFilters({}, [])
			}).to.throw(TypeError);
		});

		it('should return empty array if valid params is empty', () => {
			return expect(dbQueryDateFilter.getDateFilters({something: 'aas'}, []))
				.to.eql([]);
		});

		it('should return empty array if query does not include any of the valid params', () => {
			return expect(dbQueryDateFilter.getDateFilters({something: ''}, ['creationTime']))
				.to.eql([]);
		});

		it('should return filter with correct filedName', () => {
			let fieldName = 'creationDate';
			let query = {creationDate: '010120010000'};

			let momentDate = moment(query.creationDate, validDateFormat, true);
			let gtDate = momentDate.subtract(1, 'day').toISOString();
			let ltDate = momentDate.add(1, 'day').toISOString();


			return expect(dbQueryDateFilter.getDateFilters(query, [fieldName]))
				.to.eql([{fieldName: fieldName, op: {$gt: gtDate, $lt: ltDate}}])

		});

		context('when date is on invalid format', () => {
			let validDateParams = ['creationTime'];
			let query = {creationTime: ''};

			let invalidDates = [
				'212121',
				'10notvalid',
				'kkk',
				'albert',
				'330120010000',
				'2101200300001'
			];

			for (let invalidDate of invalidDates) {
				it(`should throw SyntaxError when date is "${invalidDate}"`, () => {
					query.creationTime = invalidDate;

					expect(() => {
						dbQueryDateFilter.getDateFilters(query, validDateParams);
					}).to.throw(SyntaxError);
				});
			}
		});

		context('when single date is on valid format', () => {
			let validDateParams = ['creationTime'];
			let query = {creationTime: ''};

			let validDates = [
				'210120010000',
				'131020182115',
				'111220170000'
			];

			for (let validDate of validDates) {
				it('should resolve with correct date filter', () => {
					let momentDate = moment(validDate, validDateFormat, true);
					let gtIsoDate = momentDate.subtract(1, 'day').toISOString();
					let ltIsoDate = momentDate.add(1, 'day').toISOString();

					query.creationTime = validDate;

					return expect(dbQueryDateFilter.getDateFilters(query, validDateParams))
						.to.eql([{fieldName: 'creationTime', op: {$gt: gtIsoDate, $lt: ltIsoDate}}])

				});
			}
		});

		context('when valid $lt and $gt on a param is provided', () => {
			const validDateParams = ['creationTime'];

			const validQueries = [
				{creationTime: ['>101020100000', '<171020100000']},
				{creationTime: ['>111220120000', '<121220130000']},
				{creationTime: ['>111220120000', '<101220150000']},
			];

			for (let validQuery of validQueries) {
				it('should resolve with correct date filter', () => {
					let gtDateString = validQuery.creationTime[0].substr(1, validQuery.creationTime[0].length);
					let ltDateString = validQuery.creationTime[1].substr(1, validQuery.creationTime[1].length);

					let gtIsoDate = moment(gtDateString, validDateFormat, true).toISOString();
					let ltIsoDate = moment(ltDateString, validDateFormat, true).toISOString();

					return expect(dbQueryDateFilter.getDateFilters(validQuery, validDateParams))
						.to.eql([{fieldName: 'creationTime', op: {$gt: gtIsoDate, $lt: ltIsoDate}}])
				});
			}

		});
	});
});