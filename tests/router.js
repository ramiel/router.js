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
  		Router.should.be.ok;
	});

	var router;

	describe('Testing simple route',function(){
		var href ='#/user/jhon';

		beforeEach(function(done){
			router = new Router();
			router.run('#/');
			done();
		});
		afterEach(function(done){
			if(router && router.destroy)
				router.destroy();
			router = null;
			done();
		});

		describe("Once router is instantiated,",function(){
			it('it is defined',function(){
		  		router.should.be.an.instanceOf(Router)
			});
			it("it has ['redirect','setLocation','add','get','addRoute','play','pause'] methods",function(done){
				['redirect','add','get','addRoute','play','pause','setLocation'].forEach(function(prop){
					router.should.have.property(prop);
				});
				done();
			});		
		});

		describe("Navigating",function(){
			it('it runs "befores"',function(done){
				var bp = new promise();
				router
					.before(function(req,next){
						req.should.have.property('href');
						bp.solve();
						next();
					}).add('/user/:username',function(){});
				bp.on=done;
				window.document.location.href = href;
			});
		});

		describe("Navigating",function(){
			it('it reachs /user/:username route, and :username is "jhon"',function(done){
				var p = new promise();
				router.add('/user/:username',function(req,next){					
					p.solve(null,req);
				})
				p.on=function(err,req){
					req.should.have.property('href','#/user/jhon');
					req.params.should.have.property('username','jhon');
					done()
				};
				window.document.location.href = href;			
			});
		});
	});

	describe('Testing',function(){
		
		beforeEach(function(done){
			router = new Router().run('#/');
			done();
		});
		afterEach(function(done){
			if(router && router.destroy)
				router.destroy();
			router = null;
			done();
		});

		describe('queries',function(){
			describe('calling #/user?a=b',function(){
				it('query exists in req and its property "a" has value "b" ',function(done){
					var p = new promise();
					router.add('#/user',function(req,next){
						p.solve(null,req);
					});
					p.on=function(err,req){
						req.should.have.property('query');
						req.query.should.have.property('a','b');
						done();
					};
					window.document.location.href = '#/user?a=b&other=value';
				});
			});
		});

		describe('options',function(){
			describe('setting ignorecase to false',function(){				
				it('ignore #/user calling #/User',function(done){
					var p = new promise();
					router = new Router({ignorecase:false})
						.add('#/user',function(){
							p.solve();
						})
						.errors(404, function( err, href){
							p.reject(err);
					    });
					p.on=function(err){
						err.should.be.ok;
						done();
					};
					window.document.location.href = '#/User';
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
						req.should.have.property('get');
						req.get.should.be.a('function');
						done();
					};
					window.document.location.href = '#/user/jhon?surname=snow';
				});
				it('req.get("surname") is snow',function(done){
					p.on=function(err,req){
						req.get('surname').should.be.equal('snow');
						done();
					};
					window.document.location.href = '#/user/jhon?surname=snow';
				});
				it('req.get("name") is jhon',function(done){
					p.on=function(err,req){
						req.get('name').should.be.equal('jhon');
						done();
					};
					window.document.location.href = '#/user/jhon?surname=snow';
				});
				it('req.get("address","fourth street") return the default value "fourth street"',function(done){
					p.on=function(err,req){
						req.get("address","fourth street").should.be.equal('fourth street');
						done();
					};
					window.document.location.href = '#/user/jhon?surname=snow';
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
					window.document.location.href = '#/user/jhon';
				});
				it('but will not match #/user/jhon/snow',function(done){
					errp.on=function(err,href){
						href.should.be.a('string');
						done();
					};
					window.document.location.href = '#/user/jhon/snow';
				});
			});

			describe('defining #/multi/** and calling #/multi/users',function(){
				it('it will match',function(done){
					multi.on=done;
					window.document.location.href = '#/multi/users';
				});
				it('and will match #/multi/users/is/a/crowd',function(done){
					multi.on=done;
					window.document.location.href = '#/multi/users/is/a/crowd';
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
						next.should.be.a('function');
						req.hasNext.should.be.true;
						done();
					}
					window.document.location.href = '#/user/jhon';
				});
				it('the next callback in before is called (and so req.hasNext)',function(done){
					first.on=function(err,req,next){
						next.should.be.a('function');
						req.hasNext.should.be.true;
						done();
					};
					window.document.location.href = '#/user/jhon';
				});
				it('the next callback in first route is called and so req.hasNext is false',function(done){
					second.on=function(err,req,next){
						expect(next).to.be.a('function');
						req.hasNext.should.be.false;
						done();
					};
					window.document.location.href = '#/user/jhon';
				});
				it('the next callback in second route,called without an error, produce an error',function(done){
					errp.on=function(err,href,code){
						code.should.be.equal(500);
						href.should.be.equal('#/user/jhon');
						done();
					};
					window.document.location.href = '#/user/jhon';
				});
				it('the next callback in first route is called with a 500 error',function(done){
					errp.on=function(err,href,code){
						code.should.be.equal(500);
						href.should.be.equal('#/user/admin');
						done();
					};
					window.document.location.href = '#/user/admin';
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
						err.should.be.equal('error message');
						href.should.be.equal('#/user/admin');
						done();
					};
					window.document.location.href = '#/user/admin';
				});
				it('the next callback in before is called with a 500 error',function(done){
					errp.on=function(err,href){
						err.should.be.equal('error message');
						href.should.be.equal('#/user/fireerror');
						done();
					};
					window.document.location.href = '#/user/fireerror';
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
					window.document.location.href = '#/path/first';
					setTimeout(function(){
						first.solve();
					},1);					
				});
			});

			describe('play should',function(){
				it('restore route handling',function(done){
					router.play();
					second.on=done;
					window.document.location.href = '#/path/second';
				});
			});

			describe('setLocation should',function(){
				it('change href',function(){
					router.play();
					router.setLocation('#/new/location');
					/#\/new\/location$/.test(window.document.location.href).should.be.ok;
				});
			});

			describe('redirect should',function(){
				it('change href and fire route',function(done){
					router.play();
					second.on=function(){
						/#\/path\/second$/.test(window.document.location.href).should.be.ok;
						done();	
					};
					router.redirect('#/path/second');					
				});

				it('change href and fire route even if change only query params',function(done){
					router.play();
					second.on=function(){
						/#\/path\/second\?q=hi$/.test(window.document.location.href).should.be.ok;
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