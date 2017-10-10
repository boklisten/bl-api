
import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const should = chai.should();

import {SEDbQuery} from "./se.db-query";
import {SEDbQueryBuilder} from "./se.db-query-builder";


describe('SEDbQueryBuilder', () => {
	describe('getDBQuery', () => {
		let seDbQueryBuilder = new SEDbQueryBuilder();

		it('should return empty SEDbQuery object', () => {
			return seDbQueryBuilder.getDbQuery({}, []).should.eventually
				.eql(new SEDbQuery({}, {}, 0, {}, 0));
		});

		it('should return correct regex for search param', () => {
			return seDbQueryBuilder.getDbQuery({s: 'hello'}, ['name'])
				.should.eventually.eql(new SEDbQuery({$or: [{name: { $regex: new RegExp('hello'), $options: 'imx'}}]}, {}, 0, {}, 0))
		});

		it('should return correct regex for search param', () => {
			let searchString = 'this is the search string!';
			let resultingRegex = {$regex: new RegExp(searchString), $options: 'imx'};
			return seDbQueryBuilder.getDbQuery({s: searchString}, ['name', 'info*'])
				.should.eventually.eql(new SEDbQuery({$or: [{name: resultingRegex}, {info: resultingRegex}]}, {}, 0, {}, 0))
		});

		it('should have limit of 4', () => {
			let lim = '4';
			return seDbQueryBuilder.getDbQuery({limit: lim}, [])
				.should.eventually.eql(new SEDbQuery({}, {}, 0, {}, parseInt(lim)));
		});

		it('should have skip equal to 4', () => {
			let skip = '4';
			return seDbQueryBuilder.getDbQuery({skip: skip}, [])
				.should.eventually.eql(new SEDbQuery({}, {}, parseInt(skip), {}, 0));
		});

		it('should have sort equal to {name:-1}', () => {
			let sort = '-name';
			return seDbQueryBuilder.getDbQuery({sort: sort}, ['name'])
				.should.eventually.eql(new SEDbQuery({}, {}, 0, {name: -1}, 0));
		});

		it('should have sort equal to {info.isbn:1}', () => {
			let sort = 'info.isbn';
			return seDbQueryBuilder.getDbQuery({sort: sort}, ['info*'])
				.should.eventually.eql(new SEDbQuery({}, {}, 0, {'info.isbn': 1}, 0));
		});

		it('should have onlyGet equal to {name: 1, info.isbn: 1}', () => {
			let onlyGet = 'name,info.isbn';
			return seDbQueryBuilder.getDbQuery({og: onlyGet}, ['name', 'info*'])
				.should.eventually.eql(new SEDbQuery({}, {name: 1, 'info.isbn': 1}, 0, {}, 0));
		});

		it('should reject', () => {
			let onlyGet = 'name,info.isbn,title';
			return seDbQueryBuilder.getDbQuery({og: onlyGet}, ['name', 'info*'])
				.should.be.rejected;
		});
	})

});
