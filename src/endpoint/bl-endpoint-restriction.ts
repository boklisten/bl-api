import { UserPermission } from '@wizardcoder/bl-model'; 

/**
 * Used when a endpoint needs restricted access.
 */
export interface BlEndpointRestriction {
  //a list of the permission the user needs
  permissions: UserPermission[];   

  //if set this endpoint is restricted to the user or for a user with higher permission
  restricted?: boolean;   

  //this endpoint is only accessible to the user that created it
  secured?: boolean; 
}
