/*
  * Licensed Materials - Property of IBM
  * (C) Copyright IBM Corp. 2016. All Rights Reserved.
  * US Government Users Restricted Rights - Use, duplication or
  * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
  */
'use strict';

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


var redis = require('../lib/redis.js')();

var currentResponse;
var previousKeyNumber;
var currentMonitor;

const ALERT_FREQUENCY = 60 * 60 * 1000;
var alertFrequency = ALERT_FREQUENCY;

const NOTTLS = /redis check ttls/i;
const MONITOR_NOTTLS = /redis monitor ttls/i;
const MONITOR_CANCEL = /redis monitor cancel/i;


var redisNotConfigured = function(res, robot) {
	// redis has not been configured
	var message = i18n.__('redis.not.configured');
	robot.logger.error(`${TAG}: ${message}`);
	robot.emit('ibmcloud.formatter', {
		response: res,
		message: message
	});
};

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

	// Natural Language match
	robot.on('redis.monitor.cancel', (res, parameters) => {
		robot.logger.debug(`${TAG}: redis.monitor.cancel - Natural Language match - res.message.text=${res.message.text}.`);
		processMonitorCancel(res);
	});

	// RegEx match
	robot.respond(MONITOR_CANCEL, {id: 'redis.monitor.cancel'}, function(res) {
		robot.logger.debug(`${TAG}: redis.monitor.cancel - RegEx match - res.message.text=${res.message.text}.`);
		processMonitorCancel(res);
	});

	function processMonitorCancel(res) {
		if (currentMonitor) {
			clearTimeout(currentMonitor);
			currentMonitor = undefined;
			previousKeyNumber = undefined;
			var message = i18n.__('redis.ttl.disable.monitor');
			robot.emit('ibmcloud.formatter', {
				response: res,
				message: message
			});
		}
		else {
			var message2 = i18n.__('redis.ttl.disable.no.monitor');
			robot.emit('ibmcloud.formatter', {
				response: res,
				message: message2
			});
		}
	}

	function processMonitorNoTtlsWrapper(res) {
		// ask how long they would like the monitoring period to be
		let prompt = i18n.__('monitor.ttls.prompt');
		utils.getExpectedResponse(res, robot, switchBoard, prompt, /(.*)/i).then((response) => {
			var selection = parseInt(response.match[1], 10);
			processMonitorNoTtls(res, selection);
		});
	}

	function processMonitorNoTtls(res, frequency) {
		if (redis) {
			// need to store the res so that we are in the right room for this user
			processNoTtlsWrapper(res, true);
			// initialize contexts
			if (res) {
				currentResponse = res;
			}

			if (frequency) {
				alertFrequency = frequency * ALERT_FREQUENCY;
			}

			var message = i18n.__('redis.ttl.enable.monitor', alertFrequency / ALERT_FREQUENCY);
			robot.emit('ibmcloud.formatter', {
				response: currentResponse,
				message: message
			});

			currentMonitor = setInterval(processMonitorNoTtls, alertFrequency);
		}
		else {
			// redis has not been configured
			redisNotConfigured(res, robot);
		}
	}

	function processNoTtlsWrapper(res, isMonitoring) {
		if (redis) {
			robot.logger.debug(`${TAG}: Processing no ttls wrapper`);
			if (!res) {
				res = currentResponse;
			}

			processNoTtls(res).then(function(result) {
				var message = i18n.__('redis.ttl.result', result);
				robot.emit('ibmcloud.formatter', {
					response: res,
					message: message
				});

				if (isMonitoring) {
					if (previousKeyNumber) {
						let percent = (result - previousKeyNumber) / 100;
						var msg = i18n.__('redis.ttl.percentage', previousKeyNumber, percent, (alertFrequency / ALERT_FREQUENCY));
						robot.emit('ibmcloud.formatter', {
							response: res,
							message: msg
						});
					}
					previousKeyNumber = result;
				}
			}).catch(function(err) {
				let errStr = JSON.stringify(err);
				var message = i18n.__('redis.error', errStr);
				robot.emit('ibmcloud.formatter', {
					response: res,
					message: message
				});
			});
		}
		else {
			// redis has not been configured
			redisNotConfigured(res, robot);
		}
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
