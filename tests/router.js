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
				console.log(router);
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
					console.log("qui",req);
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
						console.log(req);
						p.solve(null,req);
					});
					p.on=function(err,req){
						console.log(req);
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
							console.log(err);
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
		describe('special symbols',function(){});
		describe('next',function(){});
		describe('error handling',function(){});
		describe('methods',function(){});
		describe('run and destroy',function(){});
	});
  
});