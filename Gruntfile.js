module.exports = function(grunt) {

	var package_config = grunt.file.readJSON('package.json');
	package_config.basename = 'router';
	package_config.src_dir = 'src';
	package_config.dist_dir = 'dist';

  	// Project configuration.
  	grunt.initConfig({
	    pkg: package_config,

	    clean: {
		  doc: ['doc/*','!doc/sftp-config.*']
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
			        sourceMapName: '<%= pkg.dist_dir %>/<%= pkg.basename %>.min.js.map'
		    	},
		      	build: {
		    		src: '<%=pkg.src_dir %>/<%= pkg.basename %>.js',
			        dest: '<%= pkg.dist_dir %>/<%= pkg.basename %>.min.js'
		      	}
	      	//}
		},

	    jshint: {
	    	build:{
		    	files: {
			        src: ['<%=pkg.src_dir %>/<%= pkg.basename %>.js']
			    }
			}
	    },

	    karma: {
	    	options: {
				configFile: 'karma.conf.js'    
			},
	    	unit:{
			 	reporters: 'dots'
			},
			dev: {
				reporters: 'mocha'
			}
		},

		watch: {
			files : ['<%= pkg.src_dir %>/<%= pkg.basename %>.js'],
			tasks: ['jshint','uglify'],
		},

		jsdoc : {
	        main : {
	            src: ['API.md', '<%= pkg.src_dir %>/<%= pkg.basename %>.js'], 
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
	grunt.registerTask('default', 'Builds and launches tests', ['newer:uglify:build','jshint','karma:unit']);
	grunt.registerTask('precommit', 'Used internally to validate code before commit', ['newer:uglify:build']);
	grunt.registerTask('test', 'Launches all the tests', ['jshint','karma:dev']);
	grunt.registerTask('doc', 'Builds the documentation', ['clean:doc', 'jsdoc']);
};