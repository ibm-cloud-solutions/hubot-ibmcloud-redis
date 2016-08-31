/*
  * Licensed Materials - Property of IBM
  * (C) Copyright IBM Corp. 2016. All Rights Reserved.
  * US Government Users Restricted Rights - Use, duplication or
  * disclosure restricted by GSA ADP Schedule Contract with IBM Corp.
  */
'use strict';

var Redis = require('ioredis');


const REDIS_HOST = process.env.HUBOT_IBMCLOUD_REDIS_HOST;
const REDIS_PORT = process.env.HUBOT_IBMCLOUD_REDIS_PORT;
// TODO do we need a password?


module.exports = () => {
	var redis;
	if (REDIS_HOST && REDIS_PORT) {
		redis = new Redis({
			port: REDIS_PORT,
			host: REDIS_HOST
		});
	}
	return redis;
};
