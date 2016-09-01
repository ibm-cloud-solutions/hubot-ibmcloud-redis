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

					var title = i18n.__('redis.slowlog.title', obj[0]);
					const attachment = {
						title: title
					};

					robot.logger.debug(`${TAG}: redis.slowlog entry ` + obj[0]);
					attachment.fields = [
						{title: i18n.__('redis.slowlog.timestamp'), value: obj[1]},
						{title: i18n.__('redis.slowlog.execution.time'), value: obj[2]},
						{title: i18n.__('redis.slowlog.command'), value: JSON.stringify(obj[3])}
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
			var message = i18n.__('redis.not.configured');
			robot.logger.error(`${TAG}: ${message}`);
			robot.emit('ibmcloud.formatter', {
				response: res,
				message: message
			});
		}

	}
};
