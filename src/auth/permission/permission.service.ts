
import {BlDocument, UserPermission} from "bl-model";


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
		
		return "admin";
	}
	
	public haveRestrictedPermission(userId: string, userPermission: UserPermission, document: BlDocument): boolean {
		if (document.user.id === userId) return true; //the user who created the document always have access to it
		if (this.isPermissionOver(userPermission, document.user.permission)) return true;
		
		return false;
	}
	
	private isPermissionOver(permission: UserPermission, restrictedPermission: UserPermission): boolean {
		if (!restrictedPermission || !permission) return false;
		if (permission === "admin") return true; //admin is always the highest permission
		if (permission === "employee" && restrictedPermission === "customer") return true;
		return false;
	}
}