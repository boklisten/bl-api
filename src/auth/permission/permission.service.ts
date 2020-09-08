import {BlDocument, UserPermission} from '@wizardcoder/bl-model';
import {
  BlDocumentPermission,
  BlEndpointRestriction,
} from '../../collections/bl-collection';

export class SystemUser {
  id: string = 'SYSTEM';
  permission: UserPermission = 'admin';
}

export class PermissionService {
  private systemUser: SystemUser = new SystemUser();

  constructor() {}

  public getLowestPermission(
    userPermissions: UserPermission[],
  ): UserPermission {
    for (let permission of userPermissions) {
      if (permission === 'customer') return 'customer';
    }

    for (let permission of userPermissions) {
      if (permission === 'employee') return 'employee';
    }

    for (let permission of userPermissions) {
      if (permission === 'manager') return 'manager';
    }

    for (let permission of userPermissions) {
      if (permission === 'admin') return 'admin';
    }

    return 'super';
  }

  public isAdmin(userPermission: UserPermission) {
    return userPermission === 'admin' || userPermission === 'super';
  }

  public haveDocumentPermission(
    userPermission: UserPermission,
    document: BlDocument,
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
    documentPermission?: BlDocumentPermission,
  ): boolean {
    if (document.user.id === userId) return true; //the user who created the document always have access to it
    if (this.isPermissionOver(userPermission, document.user.permission)) {
      return true;
    } else {
      if (documentPermission && documentPermission.viewableForPermission) {
        return this.isPermissionEqualOrOver(
          userPermission,
          documentPermission.viewableForPermission,
        );
      }
    }
    return false;
  }

  public isPermissionEqualOrOver(
    permission: UserPermission,
    restrictedPermission: UserPermission,
  ): boolean {
    if (permission === restrictedPermission) {
      return true;
    } else {
      return this.isPermissionOver(permission, restrictedPermission);
    }
  }

  public isPermissionOver(
    permission: UserPermission,
    restrictedPermission: UserPermission,
  ): boolean {
    if (!restrictedPermission || !permission) return false;

    if (permission === 'super') return true;

    if (permission === 'admin') {
      if (
        restrictedPermission === 'manager' ||
        restrictedPermission === 'employee' ||
        restrictedPermission === 'customer'
      ) {
        return true;
      }
    }

    if (permission === 'manager') {
      if (
        restrictedPermission === 'employee' ||
        restrictedPermission === 'customer'
      ) {
        return true;
      }
    }

    if (permission === 'employee') {
      if (restrictedPermission === 'customer') {
        return true;
      }
    }

    return false;
  }
}
