import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {BlError} from "./bl-error";

chai.use(chaiAsPromised);

describe('BlError', () => {
	
	
	describe('className() and methodName()', () => {
		
		it('should be able to add className on creation', () => {
			let className = 'aClass';
			let blerror = new BlError('the message').className(className);
			
			blerror.getClassName().should.be.eql(className);
		});
		
		it('should be able to add className and methodName on creation', () => {
			let className = 'aClass';
			let methodName = 'aMethod';
			let blerror = new BlError('a message').className(className).methodName(methodName);
			
			blerror.getClassName().should.be.eql(className);
			blerror.getMethodName().should.be.eql(methodName);
		});
	});
	
	describe('add()', () => {
		it('should be able to add a BlError onto another to make a stack', () => {
			let blerror = new BlError('the first error');
			let msg = 'the second error';
			blerror.add(new BlError(msg));
			
			blerror.errorStack[0].msg.should.be.eql(msg);
		});
	});
});