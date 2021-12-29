import { Server } from "./server/server";
// AUTO IGNORED:
// eslint-disable-next-line @typescript-eslint/no-var-requires
const program = require("commander");
// AUTO IGNORED:
// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require("../package.json");
// AUTO IGNORED:
// eslint-disable-next-line @typescript-eslint/no-var-requires
const applicationConfig = require("./application-config");

program
  .version(packageJson.version)
  //.option('-p, --port [port]', 'set a port, default (1337)')
  //.option('-ho, --host [host]', 'set a host, default (localhost)')
  .option(
    "--generate-dev-environment",
    "adds test data to the default database (" +
      applicationConfig.APP_CONFIG.dev.mongoDb.dbName +
      ")"
  )
  .parse(process.argv);

if (program.generateDevEnvironment) {
  console.log("generating dev environment...");
  //const devEnv = new GeneratorDevEnvironment();
} else {
  //if (program.port) console.log('the port flag', program.port);
  //if (program.host) console.log('the host flag', program.host);

  new Server();
}
