



import {Server} from "./server";
import {GeneratorDevEnvironment} from "./generator-dev/generator.dev-environment";


if (process.argv[2]) {
	switch (process.argv[2]) {
		case "generate-dev-environment":
			console.log('generating dev environment');
			const devEnvironment = new GeneratorDevEnvironment();
			break;
	}
} else {
	console.log('starting server');
	const server = new Server();
}

