/*
  * Licensed Materials - Property of IBM
  * (C) Copyright IBM Corp. 2016. All Rights Reserved.
  * US Government Users Restricted Rights - Use, duplication or
  * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
  */
'use strict';

var Redis = require('ioredis');
const Helper = require('hubot-test-helper');
const helper = new Helper('../src/scripts');
var rewire = require('rewire');
var sinon = require('sinon');
const expect = require('chai').expect;

var slowLog = rewire('../src/scripts/redis.slowlog.js');
var ttls = rewire('../src/scripts/redis.nottls.js');


// Passing arrow functions to mocha is discouraged: https://mochajs.org/#arrow-functions
// return promises from mocha tests rather than calling done() - http://tobyho.com/2015/12/16/mocha-with-promises/
describe('Test test via Slack', function() {

	let room;

	beforeEach(function() {

		var MockRedis = sinon.stub();
		var MockStream = sinon.stub();

		var testStream = new MockStream();
		Redis.prototype.slowlog = sinon.stub().returns(Promise.resolve([[1, 1471964017, 1099, ['info']]]));
		Redis.prototype.scanStream = sinon.stub().returns(testStream);

		// MockStream.prototype.on = sinon.stub();

		var redis = new MockRedis();
		slowLog.__set__('redis', redis);

		var redis2 = new MockRedis();
		ttls.__set__('redis', redis2);

		room = helper.createRoom();
		// Force all emits into a reply.
		room.robot.on('ibmcloud.formatter', function(event) {
			if (event.message) {
				event.response.reply(event.message);
			}
			else {
				event.response.send({attachments: event.attachments});
			}
		});
	});

	afterEach(function() {
		room.destroy();
	});

	context('slowlog', function() {

		it('should retrieve the slowlog', function() {
			return room.user.say('mimiron', '@hubot redis slowlog').then(() => {
				let response = room.messages[room.messages.length - 1];
				expect(JSON.stringify(response)).to.eql('["hubot",{"attachments":[{"title":"Entry 1","fields":[{"title":"Timestamp","value":1471964017},{"title":"Microseconds for Execution","value":1099},{"title":"Command","value":"[\\"info\\"]"}]}]}]');
			});

		});

	});

	context('ttls', function() {
		it('should retrieve ttls', function() {
			return room.user.say('mimiron', '@hubot redis check ttls').then(() => {
				// let response = room.messages[room.messages.length - 1];
			});
		});
	});

});
