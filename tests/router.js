describe("Router suite.", function() {
	it("Check that Router exists and is a Function", function() {
  		Router.should.be.ok;
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

	var router,
		href ='#/user/jhon';

	var bp = {
		solved : function(){
			bp.on();
		},
		on: null
	};


	var p = {
		solved : function(){
			if(p.on){
				p.on();
			}
		},
		on: null
	};

	describe('Testing simple route',function(){
		beforeEach(function(done){
			router = new Router();
			router
				.before(function(req,next){
					req.should.have.property('href');
					bp.solved();
					next();
				})
				.add('/user/:username',function(req,next){
					req.should.have.property('href','#/user/jhon');
					req.params.should.have.property('username','jhon');
					p.solved();
				})
				.run('#/');
			done();
		});

		describe("Navigating",function(){
			it('it runs "befores"',function(done){
				bp.on=done;
				window.document.location.href = href;
			});
		});

		describe("Navigating",function(){
			it('it reachs /user/:username route, and :username is "jhon"',function(done){
				p.on=done;
				window.document.location.href = href;			
			});
		});
	});

	
  
});