module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*!\n<%= pkg.basename %>\n'+
        '@version: <%= pkg.version %>\n'+
        '@description: <%= pkg.description %>\n'+
        '@author: <%= pkg.author %>\n'+
        '@website: <%= pkg.website %>\n'+
        '@license <%= pkg.license %>\n'+
        //'Build on <%= grunt.template.today("yyyy-mm-dd") %>\n'+
        '*/',
        sourceMap: true,
        sourceMapName: '<%= pkg.basename %>.min.js.map'
      },
      build: {
        src: '<%= pkg.basename %>.js',
        dest: '<%= pkg.basename %>.min.js'
      }
    },
    jshint: {
    	files: {
	        src: ['<%= pkg.basename %>.js']
	      }
    }
  });

  
  	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');

  	// Default task(s).
	grunt.registerTask('default', ['uglify','jshint']);

};