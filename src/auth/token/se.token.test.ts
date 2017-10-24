import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {JwtPayload, SEToken} from "./se.token";

chai.use(chaiAsPromised);

describe('SeToken', () => {

	describe('createToken()', () => {
		let seToken: SEToken = new SEToken();

		it('should reject with RangeError if permissions array is 0', () => {
			return seToken.createToken('hello', [], 'something')
				.should.be.rejectedWith(RangeError);
		});

		it('should reject TypeError when username is empty', () => {
			return seToken.createToken( '', ['admin'], 'something')
				.should.be.rejectedWith(TypeError);
		});

		it('should reject TypeError when blid is empty', () => {
			return seToken.createToken('hello', ['admin'], '')
				.should.be.rejectedWith(TypeError);
		});
	});

	describe('validateToken()', () => {
		let seToken: SEToken = new SEToken();

		it('should reject with TypeError if token is empty', () => {
			return seToken.validateToken('')
				.should.be.rejectedWith(TypeError);
		});

		it('should decode so the username is the same as when signed', () => {

			return new Promise((resolve, reject) => {
				seToken.createToken('albert', ['admin'], '1').then(
					(token: string) => {
						seToken.validateToken(token).then(
							(decodedToken: JwtPayload) => {
								resolve(decodedToken.username);
							},
							(error) => {
								//no need
							});
					},
					(error) => {
						//no need for error handling in a test for resolve
					});
			}).should.eventually.be.equal('albert');
		});

		it('should reject if the token lacks permission', () => {
			return new Promise((resolve, reject) => {
				seToken.createToken('albert', ['customer'], '1').then(
					(token: string) => {
						seToken.validateToken(token, {permissions: ['admin']}).then(
							(decodedToken: JwtPayload) => {

							},
							(error: any) => {
								reject(new Error(error));
							});
					},
					(error: any) => {

					});

			}).should.be.rejectedWith(Error);
		});

		it('should reject if the blid is not valid', () => {
			return new Promise((resolve, reject) => {
			    seToken.createToken('albert', ['customer'], '1').then(
				    (token: string) =>  {
				    	seToken.validateToken(token, {blid: '2'}).then(
						    (decodedToken: JwtPayload) => {

						    },
						    (error: any) => {
						    	reject(new Error(error));
						    })
				    },
				    (error: any) => {

				    })
			}).should.be.rejectedWith(Error);
		});

		it('should reject if the name is not valid', () => {
			return new Promise((resolve, reject) => {
			    seToken.createToken('albert', ['customer'], '1').then(
				    (token: string) =>  {
				    	seToken.validateToken(token, {username: 'bill'}).then(
						    (decodedToken: JwtPayload) => {

						    },
						    (error: any) => {
						    	reject(new Error(error));
						    })
				    },
				    (error: any) => {

				    })
			}).should.be.rejectedWith(Error);
		});
	});
});