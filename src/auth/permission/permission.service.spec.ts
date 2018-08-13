import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import {expect} from 'chai';
import {PermissionService} from "./permission.service";
import {BlDocument, UserPermission} from "@wizardcoder/bl-model";
import {BlEndpointRestriction} from "../../collections/bl-collection";

chai.use(chaiAsPromised);

describe('PermissionSerivice', () => {
	const permissionService: PermissionService = new PermissionService();
	
	describe('#getLowestPermission()', () => {
		it('should return Customer if customer is the lowest permission in array', () => {
			let permissions: UserPermission[] = ["customer", "admin"];
			
			expect(permissionService.getLowestPermission(permissions))
				.to.eql("customer");
		});
		
		it('should return Customer even if customer is the last element in array', () => {
			let permissions: UserPermission[] = ["admin", "employee", "customer"];
			
			expect(permissionService.getLowestPermission(permissions))
				.to.eql('customer');
		});
		
		
		it('should return employee if that is the lowest permission', () => {
			let permissions: UserPermission[] = ["admin", "employee"];
			
			expect(permissionService.getLowestPermission(permissions))
				.to.eql('employee');
		});
		
		it('should return admin if that is the lowest permission', () => {
			expect(permissionService.getLowestPermission(["admin"]))
				.to.eq("admin");
		});
	});
	
	describe('#haveRestrictedDocumentPermission()', () => {
		it('should return true if document.user.id is the same as userId even if UserPermission is not correct', () => {
			let userId = 'aabc';
			let doc: BlDocument = {id: 'doc1', user: {id: userId, permission: "admin"}};
			let endpointRestriction = {} as BlEndpointRestriction;
			
			expect(permissionService.haveRestrictedDocumentPermission(userId, "customer", doc, endpointRestriction))
				.to.be.true;
		});
		
		it('should return false if userId is not equal to document.user.id and UserPermission is not valid', () => {
			let userId = 'abc';
			let doc: BlDocument = {id: 'doc1', user: {id: '123', permission: "admin"}};
			let endpointRestriction = {} as BlEndpointRestriction;

			expect(permissionService.haveRestrictedDocumentPermission(userId, "employee", doc, endpointRestriction))
				.to.be.false;
		});
		
		
		it('should return false if userId is not equal to document.user.id and user.permission is customer', () => {
			let userId = 'abc';
			let doc: BlDocument = {id: 'doc1', user: {id: '123', permission: "admin"}};
			let endpointRestriction = {} as BlEndpointRestriction;
			expect(permissionService.haveRestrictedDocumentPermission(userId, "employee", doc, endpointRestriction))
				.to.be.false;
		});
		
		it('should return true if userId is not equal to document.user.id but UserPermission is over the document.user.permission', () => {
			let userId = 'abc';
			let doc: BlDocument = {id: '123', user: {id: '123', permission: "employee"}};
			let endpointRestriction = {} as BlEndpointRestriction;
			
			expect(permissionService.haveRestrictedDocumentPermission(userId, "admin", doc, endpointRestriction))
				.to.be.true;
		});
	});
});