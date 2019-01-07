import {Hook} from '../../../hook/hook';
import {Branch, AccessToken} from '@wizardcoder/bl-model';
import {isNullOrUndefined} from 'util';
import {PermissionService} from '../../../auth/permission/permission.service';

export class BranchGetHook extends Hook {
  private permissionService: PermissionService;

  constructor() {
    super();
    this.permissionService = new PermissionService();
  }

  public after(
    branches: Branch[],
    accessToken: AccessToken,
  ): Promise<Branch[]> {
    branches.forEach(branch => this.resolveBranchItems(branch, accessToken));

    return Promise.resolve(branches);
  }

  private resolveBranchItems(branch: Branch, accessToken: AccessToken) {
    if (!isNullOrUndefined(branch.isBranchItemsLive)) {
      if (isNullOrUndefined(accessToken)) {
        // no user found must be "online" (bl-web)
        if (!branch.isBranchItemsLive.online) {
          // should not show branchItems
          branch.branchItems = [];
        }
      } else {
        if (
          this.permissionService.isPermissionEqualOrOver(
            accessToken.permission,
            'admin',
          )
        ) {
          return; // admin should always get the branchItems
        }

        // have a user
        if (
          !this.permissionService.isPermissionEqualOrOver(
            accessToken.permission,
            'employee',
          )
        ) {
          // user is customer
          if (!branch.isBranchItemsLive.online) {
            // user must be "online" (bl-web)
            branch.branchItems = [];
          }
        } else {
          if (!branch.isBranchItemsLive.atBranch) {
            branch.branchItems = [];
          }
        }
      }
    }
  }
}
