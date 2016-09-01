[![Build Status](https://travis-ci.org/ibm-cloud-solutions/hubot-ibmcloud-redis.svg?branch=master)](https://travis-ci.org/ibm-cloud-solutions/hubot-ibmcloud-redis)
[![Coverage Status](https://coveralls.io/repos/github/ibm-cloud-solutions/hubot-ibmcloud-redis/badge.svg?branch=master)](https://coveralls.io/github/ibm-cloud-solutions/hubot-ibmcloud-redis?branch=master)
[![Dependency Status](https://dependencyci.com/github/ibm-cloud-solutions/hubot-ibmcloud-redis/badge)](https://dependencyci.com/github/ibm-cloud-solutions/hubot-ibmcloud-redis)
[![npm](https://img.shields.io/npm/v/hubot-ibmcloud-redis.svg?maxAge=2592000)](https://www.npmjs.com/package/hubot-ibmcloud-redis)

# hubot-ibmcloud-redis

A hubot script for monitoring your use of Redis.

## Getting Started
  * [Usage](#usage)
  * [Commands](#commands)
  * [Hubot Adapter Setup](#hubot-adapter-setup)
  * [Cognitive Setup](#cognitive-setup)
  * [Development](#development)
  * [License](#license)
  * [Contribute](#contribute)

## Usage

If you are new to Hubot visit the [getting started](https://hubot.github.com/docs/) content to get a basic bot up and running.  Next, follow these steps for adding this external script into your hubot:

1. `cd` into your hubot directory
2. Install this package via `npm install @ibm/hubot-ibmcloud-redis --save`
3. Add `@ibm/hubot-ibmcloud-redis` to your `external-scripts.json`
4. Add the necessary environment variables:
```
export HUBOT_IBMCLOUD_REDIS_HOST=<Redis server hostname>
export HUBOT_IBMCLOUD_REDIS_PORT=<Redis server port>
export HUBOT_IBMCLOUD_REDIS_PASSWORD=<Optional -- Redis server password>
```

5. Start up your bot & off to the races!


## Commands

- `hubot redis check ttls` - Check to see if keys exist without a defined expiration.
- `hubot redis monitor ttls` - Monitor keys regularly to see if any are defined without an expiration.
- `hubot redis monitor cancel` - Disable the monitoring of Redis.
- `hubot redis slowlog` - Check Redis for any slow running commands.

## Hubot Adapter setup

Hubot supports a variety of adapters to connect to popular chat clients.  For more feature rich experiences you can setup the following adapters:
- [Slack setup](https://github.com/ibm-cloud-solutions/hubot-ibmcloud-redis/blob/master/docs/adapters/slack.md)
- [Facebook Messenger setup](https://github.com/ibm-cloud-solutions/hubot-ibmcloud-redis/blob/master/docs/adapters/facebook.md)

## Cognitive Setup

This project supports natural language interactions using Watson and other Bluemix services.  For more information on enabling these features, refer to [Cognitive Setup](https://github.com/ibm-cloud-solutions/hubot-ibmcloud-nlc/blob/master/docs/cognitiveSetup.md).

## Development

Please refer to the [CONTRIBUTING.md](./CONTRIBUTING.md) before starting any work.  Steps for running this script for development purposes:

### Configuration setup

- Create `config` folder in root of this project.
- create `env` in the `config` folder
- `env` contents:
```
export HUBOT_IBMCLOUD_REDIS_HOST=<Redis server hostname>
export HUBOT_IBMCLOUD_REDIS_PORT=<Redis server port>
export HUBOT_IBMCLOUD_REDIS_PASSWORD=<Optional -- Redis server password>
```

In order to view content in chat clients you will need to add `@ibm/hubot-ibmcloud-formatter` to your `external-scripts.json` file. Additionally, if you want to use `hubot-help` to make sure your command documentation is correct:
- create `external-scripts.json` in the root of this project
```
[
	"hubot-help",
	"@ibm/hubot-ibmcloud-formatter"
]
```

Lastly, run `npm install` to obtain all the dependent node modules.

### Running Hubot with adapters

Hubot supports a variety of adapters to connect to popular chat clients.

If you just want to use:
 - Terminal: run `npm run start`
 - [Slack: link to setup instructions](https://github.com/ibm-cloud-solutions/hubot-ibmcloud-redis/blob/master/docs/adapters/slack.md)
 - [Facebook Messenger: link to setup instructions](https://github.com/ibm-cloud-solutions/hubot-ibmcloud-redis/blob/master/docs/adapters/facebook.md)


## License

See [LICENSE.txt](https://github.com/ibm-cloud-solutions/hubot-ibmcloud-redis/blob/master/LICENSE.txt) for license information.

## Contribute

Please check out our [Contributing Guidelines](https://github.com/ibm-cloud-solutions/hubot-ibmcloud-redis/blob/master/CONTRIBUTING.md) for detailed information on how you can lend a hand.
