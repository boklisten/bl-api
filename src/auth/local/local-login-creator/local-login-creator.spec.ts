import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {LocalLoginCreator} from "./local-login-creator";
import {BlError} from "../../../bl-error/bl-error";
import {HashedPasswordGenerator} from "../password/hashed-password-generator";
import {SaltGenerator} from "../salt/salt-generator";
import {SeCrypto} from "../../../crypto/se.crypto";
import {ProviderIdGenerator} from "../provider-id/provider-id-generator";
import {LocalLogin} from "../../../config/schema/login-local/local-login";
import {Promise} from 'es6-promise';

chai.use(chaiAsPromised);

describe('LocalLoginCreator', () => {
	let saltGenerator = new SaltGenerator();
	let seCrypto = new SeCrypto();
	let hashedPasswordGenerator = new HashedPasswordGenerator(saltGenerator, seCrypto);
	let providerIdGenerator = new ProviderIdGenerator(seCrypto);
	let localLoginCreator = new LocalLoginCreator(hashedPasswordGenerator, providerIdGenerator);
	
	
	describe('create()', () => {
		describe('should reject with BlError when', () => {
			it('username is empty', () => {
				let username = '';
				let password = 'thisIsAValidPassword';
				return localLoginCreator.create(username, password)
					.should.be.rejectedWith(BlError);
			});
			
			it('username is undefined', () => {
				let username = undefined; let password = 'thisisavalidpassword';
				return localLoginCreator.create(username, password)
					.should.be.rejectedWith(BlError);
			});
			
			it('password is null', () => {
				let username = 'bill@mail.com';
				let password = null;
				return localLoginCreator.create(username, password)
					.should.be.rejectedWith(BlError);
			});
			
			it('password is under 6 char', () => {
				let username = 'bill@gmail.com';
				let password = 'abc';
				
				return localLoginCreator.create(username, password)
					.should.be.rejectedWith(BlError);
			});
		});
		
		describe('should resolve with a LocalLogin object when', () => {
			
			it('username and password is valid', () => {
				let username = 'bill@mail.com';
				let password = 'thisIsAValidPassword';
				
				return localLoginCreator.create(username, password).then(
					(localLogin: LocalLogin) => {
						localLogin
							.should.have.property('username')
							.and.be.eq(username);
						
						localLogin
							.should.have.property('salt')
							.and.have.length.greaterThan(10)
							.and.be.a('string');
						
						localLogin
							.should.have.property('providerId')
							.and.have.length.greaterThan(10)
							.and.be.a('string');
						
						localLogin
							.should.have.property('provider')
							.and.be.eq('local');
						
						localLogin
							.should.have.property('hashedPassword')
							.and.have.length.gte(64);
					},
					(error: any) => {
					
					});
			});
		});
		
	});
});