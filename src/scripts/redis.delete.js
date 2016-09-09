/*
  * Licensed Materials - Property of IBM
  * (C) Copyright IBM Corp. 2016. All Rights Reserved.
  * US Government Users Restricted Rights - Use, duplication or
  * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
  */
'use strict';

const path = require('path');
const TAG = path.basename(__filename);

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

const redis = require('../lib/redis.js')();

const DELETE_REGEX = /redis delete nottls/i;
const DELETE_KEY_REGEX = /(redis\sdelete\skey)\s(.*)/i;

const DELETE_ID = 'redis.delete.nottls';
const DELETE_KEY_ID = 'redis.delete.key';

let currentResponse;

module.exports = (robot) => {

	redis.on('error', function(err) {
		if (currentResponse) {
			let message = i18n.__('redis.error', err);
			robot.emit('ibmcloud.formatter', {
				response: currentResponse,
				message: message
			});
		}
	});
	// Natural Language match
	robot.on(DELETE_ID, (res) => {
		robot.logger.debug(`${TAG}: ${DELETE_ID} - Natural Language match - res.message.text=${res.message.text}.`);
		currentResponse = res;
		handleDelete(res);
	});

	// RegEx match
	robot.respond(DELETE_REGEX, {id: DELETE_ID}, function(res) {
		robot.logger.debug(`${TAG}: ${DELETE_ID} - RegEx match - res.message.text=${res.message.text}.`);
		currentResponse = res;
		handleDelete(res);
	});

	// Natural Language match
	robot.on(DELETE_KEY_ID, (res, parameters) => {
		robot.logger.debug(`${TAG}: ${DELETE_KEY_ID} - Natural Language match - res.message.text=${res.message.text}.`);
		currentResponse = res;
		if (parameters && parameters.keyName) {
			handleDeleteKey(res, parameters.keyName);
		}
		else {
			robot.logger.error(`${TAG}: Error extracting Key Name from text [${res.message.text}].`);
			let message = i18n.__('cognitive.parse.problem.delete');
			robot.emit('ibmcloud.formatter', { response: res, message: message});
		}
	});

	// RegEx match
	robot.respond(DELETE_KEY_REGEX, {id: DELETE_KEY_ID}, function(res) {
		robot.logger.debug(`${TAG}: ${DELETE_KEY_ID} - RegEx match - res.message.text=${res.message.text}.`);
		currentResponse = res;
		handleDeleteKey(res, res.match[2]);
	});

	function handleDeleteKey(res, keyName) {
		return redis.del(keyName).then(function(result) {
			if (result === 1) {
				// successfully deleted key
				let message = i18n.__('redis.deleted.success', result);
				robot.emit('ibmcloud.formatter', {
					response: res,
					message: message
				});
			}
			else {
				// failure.  deleted an unexpected number of keys -- result
				let message2 = i18n.__('redis.deleted.failure', result);
				robot.emit('ibmcloud.formatter', {
					response: res,
					message: message2
				});
			}
		});
	}

	function handleDelete(res) {
		deleteKeys().then(function(numberDeleted) {
			let message = i18n.__('redis.deleted.number', numberDeleted);
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
		let stream = redis.scanStream();
		let promises = [];

		stream.on('data', function(resultKeys) {
			for (let i = 0; i < resultKeys.length; i++) {
				promises.push(deleteIfNoTtl(resultKeys[i]));
			}
		});

		// return new promise which wraps this -
		// resolve promise only when we have the number of keys

		return new Promise(function(resolve, reject) {
			stream.on('end', function() {
				Promise.all(promises).then(function(arrayOfResults) {
					let count = 0;
					for (let i = 0; i < arrayOfResults.length; i++) {
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
