module.exports = function (grunt) {
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
            },
            test: {
                files: ["src/\*\*/\*.ts"],
                tasks: ["run:test"]
            }
        },
        nodemon: {
            dev: {
                script: './dist/index.js'
            },
            'generate-dev': {
                script: './dist/generator-dev/generator.dev-environment.js'
            }
        },
        express: {
            dev: {
                options: {
                    script: './dist/index.js'
                }
            }
        },
        concurrent: {
            dev: {
                tasks: ['ts', 'nodemon', 'watch:ts'],
                options: {
                    logConcurrentOutput: true
                }
            },
            test: {
                tasks: ['run:test', 'watch:test'],
                options: {
                    logConcurrentOutput: true
                }

            }

        },
        run: {
            test: {
                cmd: "npm",
                args: [
                    "test"
                ]
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-ts");
    grunt.loadNpmTasks("grunt-nodemon");
    grunt.loadNpmTasks("grunt-express-server");
    grunt.loadNpmTasks("grunt-concurrent");
    grunt.loadNpmTasks("grunt-run");

    grunt.registerTask("default", [
        "copy",
        "ts"
    ]);

    grunt.registerTask("dev", [
        'concurrent:dev',
        'ts',
        'nodemon:dev',
        'watch:ts'
    ]);

    grunt.registerTask("test", [
        'concurrent:test',
        "run:test",
        "watch:test"
    ]);

    grunt.registerTask('generate-dev', [
        'ts',
        'nodemon:generate-dev'
    ]);

    grunt.registerTask('build', [
        'ts'
    ]);

};
