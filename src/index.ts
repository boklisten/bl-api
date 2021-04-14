import { Server } from "./server/server";
const program = require("commander");
const packageJson = require("../package.json");
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

  const server = new Server();
}
