/*
  * Licensed Materials - Property of IBM
  * (C) Copyright IBM Corp. 2016. All Rights Reserved.
  * US Government Users Restricted Rights - Use, duplication or
  * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
  */
'use strict';

const path = require('path');
const TAG = path.basename(__filename);
const activity = require('hubot-ibmcloud-activity-emitter');
let redis = require('../lib/redis.js')();

// --------------------------------------------------------------
// i18n (internationalization)
// It will read from a peer messages.json file.  Later, these
// messages can be referenced throughout the module.
// --------------------------------------------------------------
const i18n = new (require('i18n-2'))({
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

const SLOWLOG_REGEX = /redis slowlog/i;
const SLOWLOG_ID = 'redis.slowlog';

module.exports = (robot) => {

	// Natural Language match
	robot.on(SLOWLOG_ID, (res) => {
		robot.logger.debug(`${TAG}: ${SLOWLOG_ID} - Natural Language match - res.message.text=${res.message.text}.`);
		processSlowLog(res);
	});

	// RegEx match
	robot.respond(SLOWLOG_REGEX, {id: SLOWLOG_ID}, function(res) {
		robot.logger.debug(`${TAG}: ${SLOWLOG_ID} - RegEx match - res.message.text=${res.message.text}.`);
		processSlowLog(res);
	});

	function processSlowLog(res) {
		robot.logger.debug(`${TAG}: About to retrieve slowlog results.`);
		if (redis) {
			redis.slowlog('GET', 10).then(function(result) {
				robot.logger.debug(`${TAG}: Retrieved slowlog results.`);
				let attachments = result.map(function(obj) {

					let title = i18n.__('redis.slowlog.title', obj[0]);
					const attachment = {
						title: title
					};

					robot.logger.debug(`${TAG}: entry ` + obj[0]);
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
				activity.emitBotActivity(robot, res, {activity_id: SLOWLOG_ID});
			});
		}
		else {
			// redis has not been configured
			let message = i18n.__('redis.not.configured');
			robot.logger.error(`${TAG}: ${message}`);
			robot.emit('ibmcloud.formatter', {
				response: res,
				message: message
			});
		}

	}
};
