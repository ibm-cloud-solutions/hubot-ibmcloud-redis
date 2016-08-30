/*
  * Licensed Materials - Property of IBM
  * (C) Copyright IBM Corp. 2016. All Rights Reserved.
  * US Government Users Restricted Rights - Use, duplication or
  * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
  */
'use strict';

var path = require('path');
var TAG = path.basename(__filename);
var redis = require('../lib/redis.js')();


const SLOWLOG = /redis slowlog/i;

module.exports = (robot) => {

	// Natural Language match
	robot.on('redis.slowlog', (res, parameters) => {
		robot.logger.debug(`${TAG}: redis.slowlog - Natural Language match - res.message.text=${res.message.text}.`);
		processSlowLog(res);
	});

	// RegEx match
	robot.respond(SLOWLOG, {id: 'redis.slowlog'}, function(res) {
		robot.logger.debug(`${TAG}: redis.slowlog - RegEx match - res.message.text=${res.message.text}.`);
		processSlowLog(res);
	});

	function processSlowLog(res) {
		robot.logger.debug(`${TAG}: redis.slowlog - About to retrieve slowlog results.`);
		if (redis) {
			redis.slowlog('GET', 10).then(function(result) {
				robot.logger.debug(`${TAG}: redis.slowlog - Retrieved slowlog results.`);
				var attachments = result.map(function(obj) {

					const attachment = {
						title: 'Entry ' + obj[0]
					};

					robot.logger.debug(`${TAG}: redis.slowlog entry ` + obj[0]);
					attachment.fields = [
						{title: 'Timestamp', value: obj[1]},
						{title: 'Microseconds for Execution', value: obj[2]},
						{title: 'Command', value: JSON.stringify(obj[3])}
					];

					return attachment;
				});
				robot.emit('ibmcloud.formatter', {
					response: res, attachments: attachments
				});
			});
		}
		else {
			// redis has not been configured
			var message = 'I haven\'t been configured to work with Redis. The following environment variables should be set: HUBOT_IBMCLOUD_REDIS_HOST, HUBOT_IBMCLOUD_REDIS_PORT.';
			robot.logger.error(`${TAG}: ${message}`);
			robot.emit('ibmcloud.formatter', {
				response: res,
				message: message
			});
		}

	}
};
