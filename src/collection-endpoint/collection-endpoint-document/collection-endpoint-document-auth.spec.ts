import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import * as sinon from 'sinon';
import {BlDocument, BlError} from '@wizardcoder/bl-model';
import {CollectionEndpointDocumentAuth} from "./collection-endpoint-document-auth";
import {BlApiRequest} from "../../request/bl-api-request";
import {BlEndpoint} from "../../collections/bl-collection";

chai.use(chaiAsPromised);

describe('CollectionEndpointDocumentAuth', () => {
	const collectionEndpointDocumentAuth = new CollectionEndpointDocumentAuth();
	let testBlApiRequest: BlApiRequest;
	let testDocs: BlDocument[];
	let testBlEndpoint: BlEndpoint;

	beforeEach(() => {
		testBlEndpoint = {
			restriction: {
				restricted: true
			}
		} as BlEndpoint;

		testBlApiRequest = {
			user: {
				id: 'user1',
				permission: 'customer'
			}
		};
		testDocs = [
			{
				id: 'doc1',
				user: {
					id: 'user1',
					permission: 'customer'
				}
			}
		]
	});


	it('should reject if docs is empty', () => {
		return expect(collectionEndpointDocumentAuth.validate(testBlEndpoint, [], testBlApiRequest))
			.to.be.rejectedWith(BlError, /docs is empty or undefined/);
	});

	it('should reject if blApiRequest is null or undefined', () => {
		return expect(collectionEndpointDocumentAuth.validate(testBlEndpoint, testDocs, null))
			.to.be.rejectedWith(BlError, /blApiRequest is null or undefined/);
	});

	it('should resolve if blApiRequest.user.id is equal to document.user.id', () => {
		testBlApiRequest.user.id = 'user1';
		testDocs[0].user.id = 'user1';

		return expect(collectionEndpointDocumentAuth.validate(testBlEndpoint, testDocs, testBlApiRequest))
			.to.be.fulfilled;
	});

	context('when blApiRequest.user.id is not equal to document.user.id', () => {
		context('when document.viewableFor is not set', () => {
			beforeEach(() => {
				testBlApiRequest.user.id = 'user2';
				testDocs[0].user.id = 'user1';
			});

			it('should reject if blApiRequest.user.permission is equal or lower to document.user.permission', () => {
				testBlApiRequest.user.permission = 'customer';
				testDocs[0].user.permission = 'employee';

				return expect(collectionEndpointDocumentAuth.validate(testBlEndpoint, testDocs, testBlApiRequest))
					.to.be.rejectedWith(BlError, /lacking restricted permission to view or edit the document/);
			});

			it('should resolve if blApiRequest.user.permission is higher than document.user.permission', () => {
				testBlApiRequest.user.permission = 'admin';
				testDocs[0].user.permission = 'employee';

				return expect(collectionEndpointDocumentAuth.validate(testBlEndpoint, testDocs, testBlApiRequest))
					.to.be.fulfilled;
			});
		});

		context('when document.viewableFor is set', () => {
			beforeEach(() => {
				testDocs[0].viewableFor = ['customer1'];
			});

			context('when blApiRequest.user does not have regular permission to document', () => {
				beforeEach(() => {
					testDocs[0].user.permission = 'admin';
					testDocs[0].user.id = 'user1';
					testBlApiRequest.user.id = 'user2';
					testBlApiRequest.user.permission = 'customer';
				});

				it('should reject if document.viewableFor does not include blApiRequest.user.id', () => {
					testDocs[0].viewableFor = ['user1'];
					testBlApiRequest.user.id = 'user2';

					return expect(collectionEndpointDocumentAuth.validate(testBlEndpoint, testDocs, testBlApiRequest))
						.to.be.rejectedWith(BlError, /document is not viewable for user/);
				});

				it('should resolve if document.viewableFor does include blApiRequest.user.id', () => {
					testDocs[0].viewableFor = ['user4'];
					testBlApiRequest.user.id = 'user4';

					return expect(collectionEndpointDocumentAuth.validate(testBlEndpoint, testDocs, testBlApiRequest))
						.to.be.fulfilled;
				});
			});
		});
	});




});