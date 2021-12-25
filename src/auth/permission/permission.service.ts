import { BlDocument, UserPermission } from "@boklisten/bl-model";
import {
  BlDocumentPermission,
  BlEndpointRestriction,
} from "../../collections/bl-collection";

export class SystemUser {
  id = "SYSTEM";
  permission: UserPermission = "admin";
}

export class PermissionService {
  private validPermissions = [
    "customer",
    "employee",
    "manager",
    "admin",
    "super",
  ];

  public isPermission(permission: string): boolean {
    return this.validPermissions.includes(permission);
  }

  public getLowestPermission(
    userPermissions: UserPermission[]
  ): UserPermission {
    if (userPermissions.some((permission) => permission === "customer")) {
      return "customer";
    }

    if (userPermissions.some((permission) => permission === "employee")) {
      return "employee";
    }

    if (userPermissions.some((permission) => permission === "manager")) {
      return "manager";
    }

    if (userPermissions.some((permission) => permission === "admin")) {
      return "admin";
    }

    return "super";
  }

  public isAdmin(userPermission: UserPermission) {
    return userPermission === "admin" || userPermission === "super";
  }

  public haveDocumentPermission(
    userPermission: UserPermission,
    document: BlDocument
  ) {
    return (
      this.isPermissionOver(userPermission, document.user.permission) ||
      userPermission === document.user.permission
    );
  }

  public haveRestrictedDocumentPermission(
    userId: string,
    userPermission: UserPermission,
    document: BlDocument,
    endpointRestriction: BlEndpointRestriction,
    documentPermission?: BlDocumentPermission
  ): boolean {
    if (
      document.user.id === userId ||
      this.isPermissionOver(userPermission, document.user.permission)
    ) {
      return true;
    }

    if (documentPermission?.viewableForPermission) {
      return this.isPermissionEqualOrOver(
        userPermission,
        documentPermission.viewableForPermission
      );
    }

    return false;
  }

  public isPermissionEqualOrOver(
    permission: UserPermission,
    restrictedPermission: UserPermission
  ): boolean {
    return permission === restrictedPermission
      ? true
      : this.isPermissionOver(permission, restrictedPermission);
  }

  public isPermissionOver(
    permission: UserPermission,
    restrictedPermission: UserPermission
  ): boolean {
    if (!restrictedPermission || !permission) return false;

    if (permission === "employee" && restrictedPermission === "customer") {
      return true;
    }

    if (
      permission === "manager" &&
      (restrictedPermission === "employee" ||
        restrictedPermission === "customer")
    ) {
      return true;
    }

    if (
      permission === "admin" &&
      (restrictedPermission === "manager" ||
        restrictedPermission === "employee" ||
        restrictedPermission === "customer")
    ) {
      return true;
    }

    return permission === "super";
  }
}
