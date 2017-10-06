module.exports = function(grunt) {
    "use strict";

    grunt.initConfig({
        ts: {

            app: {
                files: [{
                    src: ["src/\*\*/\*.ts", "!src/.baseDir.ts"],
                    dest: "./dist"
                }],
                options: {
                    module: "commonjs",
                    target: "es5",
                    sourceMap: false,
                    rootDir: "src"
                }
            }
        },
        watch: {
            ts: {
                files: ["src/\*\*/\*.ts"],
                tasks: ["ts"],
            },
	    js: {
		files: ["dist/\*\*/\*.js"],
		tasks: ["express:dev"],
		options: {
			spawn: false
		}
	    }
        },
	nodemon: {
		dev: {
			script: './dist/server.js'
		}
	},
	express: {
		dev: {
			options: {
				script: './dist/server.js'
			}
		}
	},
	concurrent: {
		dev: {
			tasks: ['ts', 'nodemon', 'watch:ts'],
			options: {
				logConcurrentOutput: true
			}
		}
	}
    });

    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-ts");
    grunt.loadNpmTasks("grunt-nodemon"); 
    grunt.loadNpmTasks("grunt-express-server"); 
	grunt.loadNpmTasks("grunt-concurrent"); 

    grunt.registerTask("default", [
        "copy",
        "ts"
    ]);

	grunt.registerTask("dev", [
		'concurrent',
		'ts',
		'nodemon',
		'watch:ts'
	]);

};
