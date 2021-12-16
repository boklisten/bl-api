import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { Invoice, BlError } from "@boklisten/bl-model";
import { SEDbQueryBuilder } from "../../../query/se.db-query-builder";
import { invoiceSchema } from "../invoice.schema";
import { InvoiceActive } from "./invoice-active";

export class CustomerInvoiceActive {
  private queryBuilder: SEDbQueryBuilder;
  private invoiceActive: InvoiceActive;

  constructor(private invoiceStorage?: BlDocumentStorage<Invoice>) {
    this.invoiceStorage = this.invoiceStorage
      ? this.invoiceStorage
      : new BlDocumentStorage("invoices", invoiceSchema);
    this.queryBuilder = new SEDbQueryBuilder();
    this.invoiceActive = new InvoiceActive();
  }

  public async haveActiveInvoices(userId: string): Promise<boolean> {
    const dbQuery = this.queryBuilder.getDbQuery(
      { "customerInfo.userDetail": userId },
      [{ fieldName: "customerInfo.userDetail", type: "object-id" }]
    );
    let invoices: Invoice[];
    try {
      invoices = await this.invoiceStorage.getByQuery(dbQuery);
    } catch (e) {
      if (e instanceof BlError) {
        if (e.getCode() == 702) {
          return false;
        }
      }
    }

    for (const invoice of invoices) {
      if (this.invoiceActive.isActive(invoice)) {
        return true;
      }
    }

    return false;
  }
}
