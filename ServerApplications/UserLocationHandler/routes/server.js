var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var moment = require('moment');
var ObjectId = require('mongodb').ObjectID;
var url = 'mongodb://localhost:27017/VTADailyTrips';
var express = require('express');
var router = express.Router();
var date = require('date-and-time');
var async = require('async');

router.post('/',function(req,res) {

    buildUserResponse(req.body, function(response) {

        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader('Access-Control-Allow-Methods', '*');
        res.setHeader("Access-Control-Allow-Headers", 'Content-Type,Accept');
        res.writeHead(200, {"Content-Type": "application/json"});
        res.end(JSON.stringify({"userStops": response}));

    });

});

function buildUserResponse(userLoc, callback1) {

    var routes1 = [];
    var userObj = [];
    var nearByStops = [];
    var currentTime = moment(new Date(),"HH:mm:ss");

    MongoClient.connect(url, function (err, db) {

        if(err) callbackM(err);

        db.collection('Trips').createIndex({"stop_seq": 1});            
        db.collection('10').createIndex({"point":"2dsphere"});

        getNearByStops(userLoc, function(nearByStop) {

            async.eachSeries(nearByStop, function(stopLoc, callback2) {
                updateETA1(stopLoc, function(response) {
                    callback2();
                });
            }, function(err) {
                if(err) throw err;
            });

            async.eachSeries(nearByStop, function(stopLoc, callback3) {

                findStopID(stopLoc, function(response1) {
                    
                    getTripIDs(response1, function(response2) {
                        
                        async.eachSeries(response2, function(trip, callback4) {
                            
                            getTripDetails(trip.tripid, function(response3) {

                                routes1.push(response3[0]);     
                                callback4();

                            });
                        }, function(err) {

                            if(err) throw err;
                            
                            var routes2 = routes1;
                            routes1 = [];
                            
                            userObj.push({"loc": {
                                            "lat": response1.stop_seq[0].loc.lat,
                                            "lon": response1.stop_seq[0].loc.lon,
                                      },
                                      "stopName": response1.stop_seq[0].stopName,
                                      "stopId": response1.stop_seq[0].stopId,
                                      "routes": routes2
                            });

                            callback3();
                        });                        
                    });                   
                });

            }, function(err) {
                if(err) throw err;
                return callback1(userObj);
            });
        });

        function getNearByStops(userLoc, callback) {

            db.eval('db.runCommand( {eval: "getNearStopLocations(' + userLoc.lon + ', ' + userLoc.lat + ')"})', 
                function (err, result) {
                    if(err) callback(err);
                    else {
                        for(i=0;i<3;i++){
                            nearByStops.push({"lat":result.retval[i].point.coordinates[1],"lon":result.retval[i].point.coordinates[0]});
                        }
                        return callback(nearByStops);
                    }
            });
        }

        function updateETA1(stopLoc, callback) {
            
            db.collection('Trips').find({"stop_seq.loc.lat": stopLoc.lat, "stop_seq.loc.lon": stopLoc.lon},{"tripid": 1, "stop_seq.$.stopId": 1}).toArray( function(err, docs) {
                for(var v = 0; v < docs.length; v++) {
                    for(var p =0; p < docs[v].stop_seq.length; p++) {
                        db.collection('Trips').update(
                            { "tripid": docs[v].tripid, "stop_seq.stopId": docs[v].stop_seq[p].stopId },
                            { $set: {"stop_seq.$.Eta1": moment.duration(moment(docs[v].stop_seq[p].staticArivalTime,"HH:mm:ss").diff(currentTime)).asMinutes()}}
                        );
                    }
                }
            }, function(err) {
                if(err) callback(err);
                else return callback("Success");
            });
        } 

        function  findStopID(stopLoc, callback) {
            db.collection("Trips").findOne(
            {
                "stop_seq.loc.lat": stopLoc.lat,
                "stop_seq.loc.lon": stopLoc.lon
            }, {
                    _id: 0,
                    "tripid": 1,
                    "stop_seq.$.stopId": 1
                }, function (err, stop) {
                    if(err) callback(err);
                    else return callback(stop);
                });
        }; 

        function getTripIDs(stopDetails, callback) {

            db.collection('Trips').aggregate([
            {
                $match : { 'stop_seq.stopId' : stopDetails.stop_seq[0].stopId }
            },
            {
                $unwind: "$stop_seq"
            },
            {
                $project: { tripid: 1, routeid: 1, stop_seq: 1,
                            stop_seq: { Eta1: { '$cond': {  "if": { '$lte': ['$stop_seq.Eta1', 0] },
                                                            "then": "DEPARTED",
                                                            "else": '$stop_seq.Eta1' } } } }
            },
            {
                $sort: { 'stop_seq.Eta1': 1 , 'tripid': 1}
            },
            {
                $group : { _id : '$routeid', tripid: { $first: '$tripid' } }
            }], function(err, trips) {
                    if(err) callback(err); 
                    else return callback(trips);
            });
        };

        function getTripDetails(tripID, callback) {

            db.collection('Trips').find({"tripid":tripID}).toArray(function(err,res){
                if(err) callback(err);
                else return callback(res);
            });
        };
    });
      
}
module.exports = router;