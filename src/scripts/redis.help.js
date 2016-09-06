// Description:
//	Commands for obtaining and monitoring the health of a Redis server
//
// Configuration:
//	 HUBOT_IBMCLOUD_REDIS_HOST Redis hostname
//	 HUBOT_IBMCLOUD_REDIS_PORT Redis port
//	 HUBOT_IBMCLOUD_REDIS_PASSWORD Redis password -- Optional
//
// Commands:
//   hubot redis help - Show available commands in the redis category.
//
// Author:
//	chambrid
//
/*
  * Licensed Materials - Property of IBM
  * (C) Copyright IBM Corp. 2016. All Rights Reserved.
  * US Government Users Restricted Rights - Use, duplication or
  * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
  */
'use strict';

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

const REDIS_HELP_REGEX = /redis\s+help/i;
const REDIS_HELP_ID = 'redis.help';
module.exports = (robot) => {
	robot.on(REDIS_HELP_ID, (res) => {
		robot.logger.debug(`${TAG}: ${REDIS_HELP_ID} Natural Language match.`);
		help(res);
	});
	robot.respond(REDIS_HELP_REGEX, {id: REDIS_HELP_ID}, (res) => {
		robot.logger.debug(`${TAG}: ${REDIS_HELP_ID} Reg Ex match.`);
		help(res);
	});

	function help(res) {
		robot.logger.debug(`${TAG}: ${REDIS_HELP_ID}  res.message.text=${res.message.text}.`);
		robot.logger.info(`${TAG}: Listing help redis...`);

		let help = robot.name + ' redis check ttls - ' + i18n.__('help.redis.check.ttls') + '\n'
			+ robot.name + ' redis delete nottls - ' + i18n.__('help.redis.delete.ttls') + '\n'
			+ robot.name + ' redis delete key [keyname]- ' + i18n.__('help.redis.delete.key') + '\n'
			+ robot.name + ' redis monitor ttls - ' + i18n.__('help.redis.monitor.ttls') + '\n'
			+ robot.name + ' redis monitor cancel - ' + i18n.__('help.redis.monitor.cancel') + '\n'
			+ robot.name + ' redis slowlog - ' + i18n.__('help.redis.slowlog') + '\n';

		robot.emit('ibmcloud.formatter', { response: res, message: '\n' + help});
	};
};
