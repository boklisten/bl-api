import { UserPermission } from "@boklisten/bl-model";

export class BlApiRequest {
  documentId?: string;
  query?: unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  user?: {
    id: string;
    details: string;
    permission: UserPermission;
  };
}
