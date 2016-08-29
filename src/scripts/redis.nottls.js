/*
  * Licensed Materials - Property of IBM
  * (C) Copyright IBM Corp. 2016. All Rights Reserved.
  * US Government Users Restricted Rights - Use, duplication or
  * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
  */
'use strict';

var Redis = require('ioredis');

var path = require('path');
var TAG = path.basename(__filename);

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


const NOTTLS = /redis check ttls/i;
const MONITOR_NOTTLS = /redis monitor ttls/i;

module.exports = (robot) => {

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
		processMonitorNoTtls(res);
	});

	// RegEx match
	robot.respond(MONITOR_NOTTLS, {id: 'redis.monitor.nottls'}, function(res) {
		robot.logger.debug(`${TAG}: redis.monitor.nottls - RegEx match - res.message.text=${res.message.text}.`);
		processMonitorNoTtls(res);
	});

	function processMonitorNoTtls(res) {
		// need to store the res so that we are in the right room for this user
		processNoTtlsWrapper(res);
		// initialize contexts
		currentResponse = res;
		setTimeout(processMonitorNoTtls, ALERT_FREQUENCY);
	}

	function processNoTtlsWrapper(res) {
		robot.logger.debug(`${TAG}: Processing no ttls wrapper`);
		if (!res) {
			res = currentResponse;
		}

		processNoTtls(res).then(function(result) {

			robot.emit('ibmcloud.formatter', {
				response: res,
				message: 'There are currently ' + result + ' keys without TTLs.'
			});

			// this will reset the previous key number even if someone randomly checks
			// which is probably not what we want -- this should be restricted to monitoring
			if (previousKeyNumber) {
				robot.emit('ibmcloud.formatter', {
					response: res,
					message: 'There were previously ' + previousKeyNumber + ' keys without TTLs.'
				});
			}
			previousKeyNumber = result;
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
