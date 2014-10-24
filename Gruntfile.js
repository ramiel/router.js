module.exports = function(grunt) {

  	// Project configuration.
  	grunt.initConfig({
	    pkg: grunt.file.readJSON('package.json'),

	    clean: {
		  doc: ['doc']
		},

	    uglify: {
	     	//all:{
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
	      	//}
		},

	    jshint: {
	    	build:{
		    	files: {
			        src: ['<%= pkg.basename %>.js']
			    }
			}
	    },

	    karma: {
	    	options: {
				configFile: 'karma.conf.js',
			    singleRun: true,
			    browsers: ['PhantomJS'],
			    autoWatch: true,
			    logLevel: 'OFF'				    
			},
	    	unit:{
			 	reporters: 'dots'
			},
			dev: {
				reporters: 'mocha'
			}
		},

		watch: {
			files : ['<%= pkg.basename %>.js'],
			tasks: ['jshint','uglify'],
		},

		jsdoc : {
	        main : {
	            src: ['README.md', 'router.js'], 
	            options: {
	            	configure: '.jsdoc.config',
	                destination: 'doc',
	                lenient : true,
	                private : false
	            }
	        }
    	}
  	});

  
  	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-karma');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-newer');
	grunt.loadNpmTasks('grunt-jsdoc');

  	// Default task(s).
	grunt.registerTask('default', ['newer:uglify:build','jshint','karma:unit']);
	grunt.registerTask('precommit', ['newer:uglify:build']);
	grunt.registerTask('test', ['jshint','karma:dev']);
	grunt.registerTask('doc', ['clean:doc', 'jsdoc']);
};