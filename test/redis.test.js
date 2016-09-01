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

var i18n = new (require('i18n-2'))({
	locales: ['en'],
	extension: '.json',
	// Add more languages to the list of locales when the files are created.
	directory: __dirname + '/../src/messages',
	defaultLocale: 'en',
	// Prevent messages file from being overwritten in error conditions (like poor JSON).
	updateFiles: false
});
// At some point we need to toggle this setting based on some user input.
i18n.setLocale('en');

// Passing arrow functions to mocha is discouraged: https://mochajs.org/#arrow-functions
// return promises from mocha tests rather than calling done() - http://tobyho.com/2015/12/16/mocha-with-promises/
describe('Test test via Slack', function() {

	let room;

	before(() => {
		setupSlowLogsRedis();
		setupNoTTLsRedis();
	});

	beforeEach(function() {
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

	function setupSlowLogsRedis() {
		var MockRedis = sinon.stub();
		Redis.prototype.slowlog = sinon.stub().returns(Promise.resolve([[1, 1471964017, 1099, ['info']]]));
		var redis = new MockRedis();
		return slowLog.__set__('redis', redis);
	};

	function setupNoTTLsRedis() {
		var MockRedis = sinon.stub();
		Redis.prototype.scanStream = () => {
			var scan = {};
			scan.on = (event, callback) => {
				if (event === 'data'){
					callback(['key1', 'key2']);
				}
				else {
					callback();
				}
			};
			return scan;
		};
		Redis.prototype.ttl = (key) => {
			if (key === 'key1') {
				return Promise.resolve(-1);
			}
			else {
				return Promise.resolve(200);
			}
		};

		var redis = new MockRedis();
		return ttls.__set__('redis', redis);
	};

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
				let response = room.messages[room.messages.length - 1];
				expect(response).to.eql(['hubot', '@mimiron ' + i18n.__('redis.ttl.result', 1)]);
			});
		});

		it('should enable monitoring of ttls', function() {
			return room.user.say('mimiron', '@hubot redis monitor ttls').then(() => {
				let response = room.messages[room.messages.length - 1];
				expect(response).to.eql(['hubot', '@mimiron ' + i18n.__('monitor.ttls.prompt')]);
				return room.user.say('mimiron', '1');
			}).then(() => {
				let rate = room.messages[room.messages.length - 2];
				let current = room.messages[room.messages.length - 1];
				expect(rate).to.eql(['hubot', '@mimiron ' + i18n.__('redis.ttl.enable.monitor', 1)]);
				expect(current).to.eql(['hubot', '@mimiron ' + i18n.__('redis.ttl.result', 1)]);
			});
		});

		it('should catch emit', function(done) {
			let redisNotConfigured = ttls.__get__('redisNotConfigured');
			room.reply = (message) => {
				expect(message).to.eql(i18n.__('redis.not.configured'));
				done();
			};
			redisNotConfigured(room, room.robot);
		});

	});
});
