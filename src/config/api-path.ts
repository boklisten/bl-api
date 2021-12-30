import { APP_CONFIG } from "../application-config";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const URL = require("url");

export class ApiPath {
  private baseHost: string;

  constructor() {
    if (process.env.NODE_ENV == "production") {
      this.baseHost = APP_CONFIG.path.host;
    } else if (process.env.NODE_ENV == "dev") {
      this.baseHost = APP_CONFIG.path.dev.host;
    } else {
      this.baseHost = APP_CONFIG.path.local.host;
    }
  }

  private getBasePath(): string {
    return process.env.SERVER_PATH;
  }

  public createPath(customPath: string): string {
    return this.getBasePath() + customPath;
  }

  public retrieveRefererPath(reqHeaders) {
    let refererUrl = null;

    const refererPath = reqHeaders["referer"];
    const reffererPath = reqHeaders["refferer"];

    if (refererPath) {
      refererUrl = this.retrieveBasePath(refererPath);
    } else if (reffererPath) {
      refererUrl = this.retrieveBasePath(reffererPath);
    }

    if (refererUrl && !refererUrl.includes(this.baseHost)) {
      refererUrl = null;
    }

    return refererUrl;
  }

  private retrieveBasePath(href: string) {
    const url = URL.parse(href);
    const host = url.host;
    const protocol = url.protocol;

    return protocol + "//" + host + "/";
  }
}
