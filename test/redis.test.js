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
const sprinkles = require('mocha-sprinkles');
var rewire = require('rewire');
var sinon = require('sinon');
const expect = require('chai').expect;

var redis = require('../src/lib/redis.js')();

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

// Length of time to wait for a message
const timeout = 5000;


// Passing arrow functions to mocha is discouraged: https://mochajs.org/#arrow-functions
// return promises from mocha tests rather than calling done() - http://tobyho.com/2015/12/16/mocha-with-promises/
describe('Test Redis commands via Regular Expression', function() {

	let room;

	before((done) => {
		setupSlowLogsRedis();
		setupNoTTLsRedis().then(function() {
			done();
		});
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
		var pipeline = redis.pipeline();
		pipeline.set('foo', 'bar');
		pipeline.set('name', 'nell', 'EX', 1000000);
		return pipeline.exec();
	};

	context('slowlog', function() {

		it('should retrieve the slowlog', function() {
			return room.user.say('mimiron', '@hubot redis slowlog').then(() => {
				let response = room.messages[room.messages.length - 1];
				expect(JSON.stringify(response)).to.eql('["hubot",{"attachments":[{"title":"Entry 1","fields":[{"title":"Timestamp","value":1471964017},{"title":"Microseconds for Execution","value":1099},{"title":"Command","value":"[\\"info\\"]"}]}]}]');
			});
		});

	});

	function waitForMessageQueue(room, len){
		return sprinkles.eventually({
			timeout: timeout
		}, function() {
			if (room.messages.length < len) {
				throw new Error('too soon');
			}
		}).then(() => false).catch(() => true).then((success) => {
			// Great.  Move on to tests
			expect(room.messages.length).to.eql(len);
		});
	}

	context('ttls', function() {
		it('should retrieve ttls', function() {
			return room.user.say('mimiron', '@hubot redis check ttls').then(() => {
				return waitForMessageQueue(room, 2);
			}).then(() => {
				let response = room.messages[room.messages.length - 1];
				expect(response).to.eql(['hubot', '@mimiron ' + i18n.__('redis.ttl.result', 1)]);
			});
		});

		it('should enable and disable monitoring of ttls', function() {
			return room.user.say('mimiron', '@hubot redis monitor ttls').then(() => {
				let response = room.messages[room.messages.length - 1];
				expect(response).to.eql(['hubot', '@mimiron ' + i18n.__('monitor.ttls.prompt')]);
				room.user.say('mimiron', '1');
				return waitForMessageQueue(room, 5);
			}).then(() => {
				let rate = room.messages[room.messages.length - 2];
				let current = room.messages[room.messages.length - 1];
				expect(rate).to.eql(['hubot', '@mimiron ' + i18n.__('redis.ttl.enable.monitor', 1)]);
				expect(current).to.eql(['hubot', '@mimiron ' + i18n.__('redis.ttl.result', 1)]);
				return room.user.say('mimiron', '@hubot redis monitor cancel');
			}).then(() => {
				let response = room.messages[room.messages.length - 1];
				expect(response).to.eql(['hubot', '@mimiron ' + i18n.__('redis.ttl.disable.monitor')]);
			});
		});

		it('should delete keys without ttls', function() {
			this.timeout(15000);
			return room.user.say('mimiron', '@hubot redis delete nottls').then(() => {
				return waitForMessageQueue(room, 2);
			}).then(() => {
				let response = room.messages[room.messages.length - 1];
				expect(response).to.eql(['hubot', '@mimiron ' + i18n.__('redis.deleted.number', 1)]);
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

	context('help', function() {
		it('should get the help', function() {
			return room.user.say('mimiron', '@hubot redis help').then(() => {
				return waitForMessageQueue(room, 2);
			}).then(() => {
				let response = room.messages[room.messages.length - 1];
				expect(response).to.eql(['hubot', '@mimiron \nhubot redis check ttls - ' + i18n.__('help.redis.check.ttls')
				+ '\nhubot redis delete nottls - ' + i18n.__('help.redis.delete.ttls')
				+ '\nhubot redis monitor ttls - ' + i18n.__('help.redis.monitor.ttls')
				+ '\nhubot redis monitor cancel - ' + i18n.__('help.redis.monitor.cancel')
				+ '\nhubot redis slowlog - ' + i18n.__('help.redis.slowlog') + '\n']);
			});
		});
	});
});
