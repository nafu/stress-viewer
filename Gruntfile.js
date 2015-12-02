'use strict';

// liveReloadで使う変数とか処理を定義
var
  LIVE_RELOAD_PORT = 35729,
  lrSnippet = require('connect-livereload')({port: LIVE_RELOAD_PORT}),
  mountFolder = function (connect, dir) {
    return connect.static(require('path').resolve(dir));
  }

// Gruntの内容を定義
module.exports = function(grunt) {

  // 必要なモジュール読み込み
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-open');

  grunt.initConfig({
    watch: {
      options: {
        // このオプションを付けることで、liveReloadが出来ます
        livereload: LIVE_RELOAD_PORT
      },
      html: {
        files: ['./**/*.html'],
        tasks: ['']
      },
      css: {
        files: ['./**/*.css'],
        tasks: [''] // もしCompassなどのタスクがあればここに追加する。
      },
      js: {
        files: ['./**/*.js'],
        tasks: ['']
      }
    },
    connect: {
      options: {
        port: 9000,
        hostname: '0.0.0.0'
      },
      livereload: {
        options: {
          middleware: function (connect) {
            return [
              lrSnippet,
              mountFolder(connect, './')
            ];
          }
        }
      }
    },
    open: {
      server: {
        url: 'http://localhost:<%=connect.options.port%>'
      }
    }
  });
  grunt.registerTask('default', ['connect:livereload', 'open', 'watch']);
};
