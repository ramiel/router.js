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
	    },

	    karma: {
	    	unit:{
			 	options: {
					configFile: 'karma.conf.js',
				    singleRun: true,
				    browsers: ['PhantomJS'],
				    autoWatch: true,
				    logLevel: 'OFF',
				    reporters: 'dots'
				}
			}
		},

		watch: {
			files : ['<%= pkg.basename %>.js'],
			tasks: ['jshint','uglify'],
		}
  	});

  
  	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-karma');
	grunt.loadNpmTasks('grunt-contrib-watch');

  	// Default task(s).
	grunt.registerTask('default', ['uglify','jshint','karma']);
	grunt.registerTask('precommit', ['uglify']);
	grunt.registerTask('test', ['karma']);
};