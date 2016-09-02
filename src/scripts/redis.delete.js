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

var redis = require('../lib/redis.js')();

const DELETE_REGEX = /redis delete nottls/i;
const DELETE_ID = 'redis.delete.nottls';
module.exports = (robot) => {

	// Natural Language match
	robot.on(DELETE_ID, (res) => {
		robot.logger.debug(`${TAG}: ${DELETE_ID} - Natural Language match - res.message.text=${res.message.text}.`);
		handleDelete(res);
	});

	// RegEx match
	robot.respond(DELETE_REGEX, {id: DELETE_ID}, function(res) {
		robot.logger.debug(`${TAG}: ${DELETE_ID} - RegEx match - res.message.text=${res.message.text}.`);
		handleDelete(res);
	});

	function handleDelete(res) {
		deleteKeys().then(function(numberDeleted) {
			var message = i18n.__('redis.deleted.number', numberDeleted);
			robot.emit('ibmcloud.formatter', {
				response: res,
				message: message
			});
		});
	}


	function deleteIfNoTtl(keyName) {
		return redis.ttl(keyName).then(function(ttlResult) {
			if (ttlResult === -1) {
				return redis.del(keyName);
			}
			else {
				return Promise.resolve(0);
			}
		});
	}

	function deleteKeys() {
		var stream = redis.scanStream();
		var promises = [];

		stream.on('data', function(resultKeys) {
			for (var i = 0; i < resultKeys.length; i++) {
				promises.push(deleteIfNoTtl(resultKeys[i]));
			}
		});

		// return new promise which wraps this -
		// resolve promise only when we have the number of keys

		return new Promise(function(resolve, reject) {
			stream.on('end', function() {
				Promise.all(promises).then(function(arrayOfResults) {
					var count = 0;
					for (var i = 0; i < arrayOfResults.length; i++) {
						count += arrayOfResults[i];
					}
					resolve(count);
				}).catch(function(err) {
					reject(err);
				});
			});
		});
	}
};
