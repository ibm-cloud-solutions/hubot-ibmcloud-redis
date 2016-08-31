/*
  * Licensed Materials - Property of IBM
  * (C) Copyright IBM Corp. 2016. All Rights Reserved.
  * US Government Users Restricted Rights - Use, duplication or
  * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
  */
'use strict';

var Redis = require('ioredis');
const utils = require('hubot-ibmcloud-utils').utils;
const Conversation = require('hubot-conversation');

var path = require('path');
var TAG = path.basename(__filename);

// --------------------------------------------------------------
// i18n (internationalization)
// It will read from a peer messages.json file.  Later, these
// messages can be referenced throughout the module.
// --------------------------------------------------------------
var i18n = new (require('i18n-2'))({
	locales: ['en'],
	extension: '.json',
	// Add more languages to the list of locales when the files are created.
	directory: __dirname + '/../messages',
	defaultLocale: 'en',
	// Prevent messages file from being overwritten in error conditions (like poor JSON).
	updateFiles: false
});
// At some point we need to toggle this setting based on some user input.
i18n.setLocale('en');

const REDIS_HOST = process.env.HUBOT_IBMCLOUD_REDIS_HOST;
const REDIS_PORT = process.env.HUBOT_IBMCLOUD_REDIS_PORT;

// TODO checking to make sure env variables are set -- where is the best place to do this?
// TODO do we need a password?

var redis = new Redis({
	port: REDIS_PORT,
	host: REDIS_HOST
});

var currentResponse;

var previousKeyNumber;

const ALERT_FREQUENCY = 60 * 60 * 1000;
var alertFrequency = ALERT_FREQUENCY;


const NOTTLS = /redis check ttls/i;
const MONITOR_NOTTLS = /redis monitor ttls/i;

module.exports = (robot) => {

	var switchBoard = new Conversation(robot);

	// Natural Language match
	robot.on('redis.nottls', (res, parameters) => {
		robot.logger.debug(`${TAG}: redis.nottls - Natural Language match - res.message.text=${res.message.text}.`);
		processNoTtlsWrapper(res);
	});

	// RegEx match
	robot.respond(NOTTLS, {id: 'redis.nottls'}, function(res) {
		robot.logger.debug(`${TAG}: redis.nottls - RegEx match - res.message.text=${res.message.text}.`);
		processNoTtlsWrapper(res);
	});

	// Natural Language match
	robot.on('redis.monitor.nottls', (res, parameters) => {
		robot.logger.debug(`${TAG}: redis.monitor.nottls - Natural Language match - res.message.text=${res.message.text}.`);
		processMonitorNoTtlsWrapper(res);
	});

	// RegEx match
	robot.respond(MONITOR_NOTTLS, {id: 'redis.monitor.nottls'}, function(res) {
		robot.logger.debug(`${TAG}: redis.monitor.nottls - RegEx match - res.message.text=${res.message.text}.`);
		processMonitorNoTtlsWrapper(res);
	});

	function processMonitorNoTtlsWrapper(res) {
		// ask how long they would like the monitoring period to be
		let prompt = i18n.__('monitor.ttls.prompt');
		utils.getExpectedResponse(res, robot, switchBoard, prompt, /(.*)/i).then((response) => {
			var selection = parseInt(response.match[1], 10);
			processMonitorNoTtls(res, selection);
		});
	}

	function processMonitorNoTtls(res, frequency) {
		// need to store the res so that we are in the right room for this user
		processNoTtlsWrapper(res, true);
		// initialize contexts
		if (res) {
			currentResponse = res;
		}

		if (frequency) {
			alertFrequency = frequency * 60 * 60 * 1000;
		}

		robot.emit('ibmcloud.formatter', {
			response: currentResponse,
			message: 'Will check again in ' + alertFrequency / (60 * 60 * 1000) + ' hours'
		});

		setTimeout(processMonitorNoTtls, alertFrequency);
	}

	function processNoTtlsWrapper(res, isMonitoring) {
		robot.logger.debug(`${TAG}: Processing no ttls wrapper`);
		if (!res) {
			res = currentResponse;
		}

		processNoTtls(res).then(function(result) {
			console.log('processNoTtls');
			robot.emit('ibmcloud.formatter', {
				response: res,
				message: 'There are currently ' + result + ' keys without TTLs.'
			});

			if (isMonitoring) {
				if (previousKeyNumber) {
					robot.emit('ibmcloud.formatter', {
						response: res,
						message: 'There were previously ' + previousKeyNumber + ' keys without TTLs.  This is a change of ' + (result - previousKeyNumber) / 100 + ' percent over the last ' + alertFrequency + ' hours.'
					});
				}
				previousKeyNumber = result;
			}
		}).catch(function(err) {
			robot.emit('ibmcloud.formatter', {
				response: res,
				message: 'An error occurred: ' + err
			});
		});
	}

	function processNoTtls(res) {
		var count = 0;
		var stream = redis.scanStream();
		var promises = [];

		stream.on('data', function(resultKeys) {
			for (var i = 0; i < resultKeys.length; i++) {
				promises.push(redis.ttl(resultKeys[i]));
			}
		});

		// return new promise which wraps this -
		// resolve promise only when we have the number of keys

		return new Promise(function(resolve, reject) {
			stream.on('end', function() {
				Promise.all(promises).then(function(arrayOfResults) {
					for (var i = 0; i < arrayOfResults.length; i++) {
						if (arrayOfResults[i] === -1) {
							count++;
						}
					}
					resolve(count);
				}).catch(function(err) {
					reject(err);
				});
			});
		});
	}
};
