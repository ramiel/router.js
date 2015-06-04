var promise = function(){
		this.on = null;
	};
promise.prototype.solve = function(){
	if(this.on instanceof Function){
		this.on.apply(this.on,Array.prototype.slice.call(arguments));
	}
};

promise.prototype.reject = function(err){
	err = err || 'generic error';
	if(this.on instanceof Function){
		this.on(err);
	}
};

//Disabling router.js error default warnings
console.warn=null;

describe("Router suite.", function() {
	it("Check that Router exists and is a Function", function() {
  		expect(Router).to.be.a(Function);
	});

	var router;

	describe('Testing simple route',function(){
		var href ='#/user/jhon';

		beforeEach(function(){
			router = new Router();
			router.run('#/');
		});
		afterEach(function(){
			if(router && router.destroy)
				router.destroy();
			router = null;
		});

		describe("Once router is instantiated,",function(){
			it('it is defined',function(){
		  		expect(router).to.be.a(Router);
			});
			it("it has ['redirect','setLocation','add','get','addRoute','play','pause'] methods",function(){
				var properties = ['redirect','add','get','addRoute','play','pause','setLocation'],
					prop;
				for(var i = 0, len = properties.length; i < len; i++){
					prop = properties[i];
					expect(router).to.have.property(prop);
				}
			});		
		});

		describe("Navigating",function(){
			it('it runs "befores"',function(done){
				router
					.before(function(req,next){
						expect(req).to.have.property('href');
						done();
					})
					.add('/user/:username',function(){});
				window.location.href = href;
			});
		});

		describe("Navigating",function(){
			it('it reachs /user/:username route, and :username is "jhon"',function(done){
				router.add('/user/:username',function(req,next){					
					expect(req).to.have.property('href')
					expect(req.href).to.be('#/user/jhon');
					expect(req.params).to.have.keys('username')
					expect(req.params.username).to.be('jhon');
					done();
				});
				window.location.href = href;			
			});
		});
	});

	describe('Testing',function(){
		
		beforeEach(function(){
			router = new Router().run('#/');
		});
		afterEach(function(){
			if(router && router.destroy)
				router.destroy();
			router = null;
		});

		describe('queries',function(){
			describe('calling #/user?a=b',function(){
				it('query exists in req and its property "a" has value "b" ',function(done){
					router.add('#/user',function(req,next){
						expect(req).to.have.property('query');
						expect(req.query).to.have.key('a')
						expect(req.query.a).to.be('b');
						done();
					});
					window.location.href = '#/user?a=b&other=value';
				});
			});
		});

		describe('options',function(){
			describe('setting ignorecase to false',function(){				
				it('ignore #/user calling #/User',function(done){
					router = new Router({ignorecase:false})
						.add('#/user',function(){
							done('should not reach this because of ignorecase option')
						})
						.errors(404, function( err, href){
							done();
					    });
					window.location.href = '#/User';
				});
			});
		});
		
		describe('Req.get',function(){
			var p = new promise();
			beforeEach(function(done){
				router.add('#/user/:name',function(req,next){
					p.solve(null,req,next);
				});
				done();
			});
			
			describe('defining #/user/:name and calling #/user/jhon?surname=snow',function(){
				it('req has "get" property and is a Function',function(done){
					p.on=function(err,req){
						expect(req).to.have.property('get');
						expect(req.get).to.be.a('function');
						done();
					};
					window.location.href = '#/user/jhon?surname=snow';
				});
				it('req.get("surname") is snow',function(done){
					p.on=function(err,req){
						expect(req.get('surname')).to.be('snow');
						done();
					};
					window.location.href = '#/user/jhon?surname=snow';
				});
				it('req.get("name") is jhon',function(done){
					p.on=function(err,req){
						expect(req.get('name')).to.be('jhon');
						done();
					};
					window.location.href = '#/user/jhon?surname=snow';
				});
				it('req.get("address","fourth street") return the default value "fourth street"',function(done){
					p.on=function(err,req){
						expect(req.get("address","fourth street")).to.be('fourth street');
						done();
					};
					window.location.href = '#/user/jhon?surname=snow';
				});
			});
		});

		describe('special symbols',function(){
			var p = new promise(),
				multi = new promise(),
				errp = new promise();
			beforeEach(function(done){
				router
				.add('#/user/*',function(req,next){
					p.solve(null,req,next);
				})
				.add('#/multi/**',function(req,next){
					multi.solve(null,req,next);
				})
				.errors(404,function(err, href){
					errp.solve(err,href);
				});
				done();
			});
			
			describe('defining #/user/* and calling #/user/jhon',function(){
				it('it will match',function(done){
					p.on=done;
					window.location.href = '#/user/jhon';
				});
				it('but will not match #/user/jhon/snow',function(done){
					errp.on=function(err,href){
						expect(href).to.be.a('string');
						done();
					};
					window.location.href = '#/user/jhon/snow';
				});
			});

			describe('defining #/multi/** and calling #/multi/users',function(){
				it('it will match',function(done){
					multi.on=done;
					window.location.href = '#/multi/users';
				});
				it('and will match #/multi/users/is/a/crowd',function(done){
					multi.on=done;
					window.location.href = '#/multi/users/is/a/crowd';
				});
			});

		});

		describe('next',function(){
			var first = new promise(),
				second = new promise(),
				bef = new promise(),
				errp = new promise();
			beforeEach(function(done){
				router
				.before(function(req,next){
					bef.solve(null,req,next);
					next();
				})
				.add('#/user/:username',function(req,next){
					if(req.get('username') == 'admin')
						next('Invalid username',500);
					first.solve(null,req,next);
					next();
				})
				.add('#/user/*',function(req,next){
					second.solve(null,req,next);
					next();
				})
				.errors(500,function(err,href){
					errp.solve(err,href,500);
				});
				done();
			});

			describe('Defining a before, two matching routes and an error route',function(){
				it('in the before next is function (and so req.hasNext)',function(done){
					bef.on=function(err,req,next){
						expect(next).to.be.a('function');
						expect(req.hasNext).to.be(true);
						done();
					}
					window.location.href = '#/user/jhon';
				});
				it('the next callback in before is called (and so req.hasNext)',function(done){
					first.on=function(err,req,next){
						expect(next).to.be.a('function');
						expect(req.hasNext).to.be(true);
						done();
					};
					window.location.href = '#/user/jhon';
				});
				it('the next callback in first route is called and so req.hasNext is false',function(done){
					second.on=function(err,req,next){
						expect(next).to.be.a('function');
						expect(req.hasNext).to.be(false);
						done();
					};
					window.location.href = '#/user/jhon';
				});
				it('the next callback in second route,called without an error, produce an error',function(done){
					errp.on=function(err,href,code){
						expect(code).to.be(500);
						expect(href).to.be('#/user/jhon');
						done();
					};
					window.location.href = '#/user/jhon';
				});
				it('the next callback in first route is called with a 500 error',function(done){
					errp.on=function(err,href,code){
						expect(code).to.be(500);
						expect(href).to.be('#/user/admin');
						done();
					};
					window.location.href = '#/user/admin';
				});
			});
		});

		describe('error handling',function(){
			var first = new promise(),
				second = new promise(),
				bef = new promise(),
				errp = new promise();
			beforeEach(function(done){
				router
				.before(function(req,next){
					if(req.href == '#/user/fireerror')
						next('error message',500);
					next();
				})
				.add('#/user/:username',function(req,next){
					if(req.get('username') == 'admin')
						next('error message',500);
					first.solve(null,req,next);
					next();
				})
				.add('#/user/*',function(req,next){
					second.solve(null,req,next)
				})
				.errors(500,function(err,href){
					errp.solve(err,href);
				});
				done();
			});

			describe('Defining a before, two matching routes and an error route',function(){
				it('the next callback in first route is called with a 500 error',function(done){
					errp.on=function(err,href){
						expect(err).to.be('error message');
						expect(href).to.be('#/user/admin');
						done();
					};
					window.location.href = '#/user/admin';
				});
				it('the next callback in before is called with a 500 error',function(done){
					errp.on=function(err,href){
						expect(err).to.be('error message');
						expect(href).to.be('#/user/fireerror');
						done();
					};
					window.location.href = '#/user/fireerror';
				});
			});
		});

		describe('methods',function(){
			var first,second;
			beforeEach(function(done){
				second=new promise();
				first=new promise();
				router
					.add('#/path/first',function(req,next){
						first.solve('fired',req,next);
					})
					.add('#/path/second',function(req,next){
						second.solve(null,req,next)
					});
				router.pause();
				done();
			});

			describe('pause should',function(){
				it('stop route handling',function(done){
					first.on=done;
					window.location.href = '#/path/first';
					setTimeout(function(){
						first.solve();
					},1);					
				});
			});

			describe('play should',function(){
				it('restore route handling',function(done){
					router.play();
					second.on=done;
					window.location.href = '#/path/second';
				});
			});

			describe('setLocation should',function(){
				it('change href',function(){
					router.play();
					router.setLocation('#/new/location');
					expect(window.location.href).to.match(/#\/new\/location$/);
				});
			});

			describe('redirect should',function(){
				it('change href and fire route',function(done){
					router.play();
					second.on=function(){
						expect(window.location.href).to.match(/#\/path\/second$/);
						done();	
					};
					router.redirect('#/path/second');					
				});

				it('change href and fire route even if change only query params',function(done){
					router.play();
					second.on=function(){
						expect(window.location.href).to.match(/#\/path\/second\?q=hi$/);
						done();	
					};
					router.redirect('#/path/second?q=hi');					
				});
			});

		});


		describe('run and destroy',function(){

			var first,second,third;
			beforeEach(function(done){
				second=new promise();
				first=new promise();
				third=new promise();
				router
					.add('#/path/first',function(req,next){
						first.solve(null,req,next);
					})
					.add('#/path/second',function(req,next){
						second.solve(null,req,next)
					})
					.add('#/path/third',function(req,next){
						third.solve('error');
					});
				window.location.href='#/path/first';
				done();
			});

			describe('"run" with no parameter',function(){
				it('launch router with current url',function(done){
					first.on=done;
					router.run();
				});
			});

			describe('"run" with parameter',function(){
				it('launch router with specified url',function(done){
					second.on=done;
					router.run('#/path/second');
				});
			});

			describe('destroy',function(){
				it('remove router event halders',function(done){
					router.destroy();
					third.on=done;
					window.location.href='#/path/third';
					setTimeout(function(){
						done();
					},1);
				});
			});
		});
	});
  
});
