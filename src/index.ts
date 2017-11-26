



import {Server} from "./server";
import {GeneratorDevEnvironment} from "./generator-dev/generator.dev-environment";

console.log('the argument was', process.argv[2]);

if (process.argv[2]) {
	switch (process.argv[2]) {
		case "generate-dev-environment":
			const devEnvironment = new GeneratorDevEnvironment();
			break;
	}
} else {
	const server = new Server();
}

