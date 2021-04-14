import { UserPermission } from "@boklisten/bl-model";

export class BlApiRequest {
  documentId?: string;
  query?: any;
  data?: any;
  user?: {
    id: string;
    permission: UserPermission;
  };
}
