
import {UserPermission} from "bl-model";

export class PermissionService {
	
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
}