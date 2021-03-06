Meteor.startup(function (){

	//REMOVE THESE TO RETAIN NEW DB ENTRIES
	// console.log('Clearing database... check server/server.js[ln:5] to stop this from happening.')
	// Meteor.users.remove({});
	// Requests.remove({});
	// Transactions.remove({});


	//If Users collection is empty, fill it with seed!
	if( Meteor.users.find().count() === 0 ){
		console.log('No Users! Bootstrapping data from private/seed_users.json...');

		//import data from seed_users and add it to the collection
		var seedUsers = JSON.parse(Assets.getText("seed_users.json"));
		for(var i = 0; i < seedUsers.entries.length; i++){
			Meteor.users.insert(
				seedUsers.entries[i], 
				{ validate: false },
				function( error, result ){
					if( error ){
						console.log( error );
					}else{
						//console.log( result );
					}
				});
			Meteor.users.update(
				{ _id : seedUsers.entries[i]._id },
				{ $set : { createdAt : new Date(seedUsers.entries[i].createdAt) }},
				{ validationContext : "updateForm" },
				function( error, result){
					if( error ){
						console.log( error );
					}else{
						//console.log( result );
					}
				});
		}
	}

	//If Requests collection is empty, fill it with seed!
	if( Requests.find().count() === 0 ){
		console.log('No Request History! Bootstrapping data from private/seed_requests.json...');

		//import data from seed_requests and add it to the collection
		var seedRequests = JSON.parse(Assets.getText("seed_requests.json"));
		for( var i = 0; i < seedRequests.entries.length; i++ ){
			Requests.insert(
				seedRequests.entries[i], 
				{ validate: false },
				function( error, result ){
					if( error ){
						console.log( error );
					}else{
						//console.log( result );
					}
				});
		}

		//link the imported requestsIDs with users in Meteor.users
		for( var i = 0; i < Requests.find({}).count(); i++ ){
			var randomID = Meteor.call( 'getRandomUser' ).result._id;
			Requests.update(
				{ requestorID : null },
				{ $set: { requestorID : randomID } },
				{ validationContext: "updateForm" },
				function( error, result ){
					if( error ){
						console.log( error );
					}else{
						//console.log( result );
					}
				});
		}

	 	//link requests to postedRequests[] for the selected user!
	 	var allRequests = Requests.find({}).fetch();
	 	for (var i = 0; i < allRequests.length; i++) {

	 		//get requestor and add the new request
	 		var requestor = Meteor.users.findOne({ _id : allRequests[i].requestorID });

			//if endDate is in the past, push to completed requests
		 	if(~moment(allRequests[i].endDate).fromNow().indexOf("ago")){
				requestor.profile.postedRequests.completed.push( allRequests[i]._id );
			}else{
				requestor.profile.postedRequests.active.push( allRequests[i]._id );
			}
	 		Meteor.users.update(
	 				{ _id : requestor._id },
	 				{ $set : { "profile.postedRequests" : requestor.profile.postedRequests }},
	 				{ validationContext : "updateForm"},
	 				function( error, result ){
	 					if( error ){
	 						console.log( error );
	 					}else{
	 						//console.log( result );
	 					}
	 				}
	 			)};
	}

	//generate transactions
	if( Transactions.find().count() === 0 ){
		var numTransactions = 200;
		var maxAmount = 5.00;
		console.log('No Transaction History! Generating ' + numTransactions + ' fake transactions...');

		for (var i = 0; i < numTransactions; i++) {
			var request = Meteor.call( 'getRandomRequest' ).result;
			//console.log("request.requestorID : " + request.requestorID);
			var donor = Meteor.call( 'getRandomUser' ).result;
			//console.log("donor._id : " + donor._id);

			if( request.requestorID !== donor._id ){
				var transactionArgs =  {donorID : donor._id, 
							      		requestID : request._id, 
							      		amount : (Math.round((Math.random()*maxAmount)*2)/2) };

				Meteor.call( 'doTransaction', 
							  transactionArgs,
							  function(err,res){
							  	//console.log(err, res);
							  } );
				}		
		}
	}
});
