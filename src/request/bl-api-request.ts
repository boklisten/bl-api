import { UserPermission } from "@boklisten/bl-model";

export class BlApiRequest {
  documentId?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  user?: {
    id: string;
    permission: UserPermission;
  };
}
