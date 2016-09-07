/*
  * Licensed Materials - Property of IBM
  * (C) Copyright IBM Corp. 2016. All Rights Reserved.
  * US Government Users Restricted Rights - Use, duplication or
  * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
  */
'use strict';

const Redis = require('ioredis');
const REDIS_HOST = process.env.HUBOT_IBMCLOUD_REDIS_HOST;
const REDIS_PORT = process.env.HUBOT_IBMCLOUD_REDIS_PORT;
const REDIS_PASSWORD = process.env.HUBOT_IBMCLOUD_REDIS_PASSWORD;


module.exports = () => {
	let redis;
	if (REDIS_HOST && REDIS_PORT) {
		let redisConfig = {
			port: REDIS_PORT,
			host: REDIS_HOST
		};
		if (REDIS_PASSWORD) {
			redisConfig.password = REDIS_PASSWORD;
		}
		redis = new Redis(redisConfig);
	}
	return redis;
};
