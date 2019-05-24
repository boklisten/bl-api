const webpackConfig = require('./webpack.config');
const packageJson = require('./package.json');

module.exports = function(grunt) {
  'use strict';

  grunt.initConfig({
    ts: {
      app: {
        files: [
          {
            src: ['src/**/*.ts', '!src/.baseDir.ts'],
            dest: './dist',
          },
        ],
        options: {
          module: 'commonjs',
          target: 'ES2016',
          sourceMap: false,
          rootDir: 'src',
        },
      },
    },
    watch: {
      ts: {
        files: ['src/**/*.ts'],
        tasks: ['ts'],
      },
      js: {
        files: ['dist/**/*.js'],
        tasks: ['express:dev'],
        options: {
          spawn: false,
        },
      },
      test: {
        files: ['src/**/*.ts'],
        tasks: ['run:test'],
      },
    },
    nodemon: {
      dev: {
        options: {
          watch: ['src'],
          ext: 'ts',
          ignore: ['src/**/*.spec.ts'],
          exec: 'ts-node ./src/index.ts --log-silly',
        },
      },
      'generate-dev': {
        script: './dist/generator-dev/generator.dev-environment.js',
      },
    },
    express: {
      dev: {
        options: {
          script: './dist/index.js',
        },
      },
    },
    concurrent: {
      dev: {
        tasks: ['ts', 'nodemon', 'watch:ts'],
        options: {
          logConcurrentOutput: true,
        },
      },
      test: {
        tasks: ['run:test', 'watch:test'],
        options: {
          logConcurrentOutput: true,
        },
      },
    },
    run: {
      test: {
        cmd: 'npm',
        args: ['test'],
      },
    },
    webpack: {
      options: {
        stats: !process.env.NODE_ENV || process.env.NODE_ENV === 'development',
      },
      prod: webpackConfig,
      dev: Object.assign({watch: true}, webpackConfig),
    },
    copy: {
      prod: {
        files: [
          {expand: true, src: ['README.md'], dest: 'dist/', filter: 'isFile'},
        ],
      },
      backup: {
        files: [
          {
            cwd: '.',
            src: [
              'dist/' + packageJson.name + '-' + packageJson.version + '.tgz',
            ],
            dest: '~/.bl-dist/' + packageJson.name + '/',
            filter: 'isFile',
          },
        ],
      },
    },
    compress: {
      prod: {
        options: {
          archive:
            'dist/' + packageJson.name + '-' + packageJson.version + '.tgz',
        },
        files: [
          {
            expand: true,
            cwd: 'dist/',
            src: ['**'],
            dest: './',
            filter: 'isFile',
          },
        ],
      },
    },
    clean: {
      dist: {
        src: ['./dist/'],
      },
    },
    shell: {
      backup: {
        command:
          'mkdir --parents ~/.bl-dist/' +
          packageJson.name +
          '/; mv ./dist/' +
          packageJson.name +
          '-' +
          packageJson.version +
          '.tgz ~/.bl-dist/' +
          packageJson.name +
          '/',
      },
    },
    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          captureFile: 'results.txt', // Optionally capture the reporter output to a file
          quiet: false, // Optionally suppress output to standard out (defaults to false)
          clearRequireCache: true, // Optionally clear the require cache before running tests (defaults to false)
          // clearCacheFilter: (key) => {return true}, // Optionally defines which files should keep in cache
          noFail: false, // Optionally set to not fail on failed tests (will still fail on other errors)
        },
        src: ['test/**/*.js'],
      },
    },
  });

  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-ts');
  grunt.loadNpmTasks('grunt-nodemon');
  grunt.loadNpmTasks('grunt-express-server');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-run');
  grunt.loadNpmTasks('grunt-webpack');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.registerTask('watch', ['nodemon:dev']);

  grunt.registerTask('pkg', [
    'clean:dist',
    'webpack:prod',
    'copy:prod',
    'compress:prod',
    'shell:backup',
  ]);

  grunt.registerTask('test', ['concurrent:test', 'run:test', 'watch:test']);

  grunt.registerTask('generate-dev', ['ts', 'nodemon:generate-dev']);

  grunt.registerTask('build', ['ts']);
};
