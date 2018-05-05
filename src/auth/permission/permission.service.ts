
import {BlDocument, UserPermission} from "@wizardcoder/bl-model";


export class SystemUser {
	id: string = 'SYSTEM';
	permission: UserPermission = "admin";
}

export class PermissionService {
	private systemUser: SystemUser = new SystemUser();
	
	constructor() {
	
	}
	
	public getLowestPermission(userPermissions: UserPermission[]): UserPermission {
		for (let permission of userPermissions) {
			if (permission === "customer") return "customer";
		}
		
		for (let permission of userPermissions) {
			if (permission === "employee") return "employee";
		}

		for (let permission of userPermissions) {
			if (permission === "admin") return "admin";
		}
		
		return "super";
	}
	
	public haveRestrictedPermission(userId: string, userPermission: UserPermission, document: BlDocument): boolean {
		if (document.user.id === userId) return true; //the user who created the document always have access to it
		return (this.isPermissionOver(userPermission, document.user.permission));
	}
	
	private isPermissionOver(permission: UserPermission, restrictedPermission: UserPermission): boolean {
		if (!restrictedPermission || !permission) return false;

		if (permission === 'super') return true;

		if (permission === 'admin') {
			if (restrictedPermission === 'employee' || restrictedPermission === 'customer') {
				return true;
			}
		}

		if (permission === "employee") {
			if (restrictedPermission === "customer") {
				return true;
			}
		}

		return false;
	}
}