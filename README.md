[![Build Status](https://travis.innovate.ibm.com/BluemixSolutions/hubot-ibmcloud-scrtipt-skeleton.svg?token=Gn7Cdz9YEJSDvAVxXAUD&branch=master)](https://travis.innovate.ibm.com/BluemixSolutions/hubot-ibmcloud-scrtipt-skeleton)
[![Coverage Status](https://pages.github.ibm.com/BluemixSolutions/hubot-ibmcloud-scrtipt-skeleton/coverage/badge.svg)](https://pages.github.ibm.com/BluemixSolutions/hubot-ibmcloud-scrtipt-skeleton/coverage/lcov-report/index.html)

# hubot-ibmcloud-script-skeleton

Starting point for your new hubot script.  Clone this project and start editing.

_Note_:  This project makes use of internal forks of public packages, privately hosted on a secured private npm registry until we can deliver the work back to the open source community.  In order to run this project you will need to set up a `.npmrc` file.  [See our wiki for more information](https://github.ibm.com/BluemixSolutions/BluemixSolutions/wiki/.npmrc-and-npm-auth-tokens)

## Getting Started
  * [Usage](#usage)
  * [Commands](#commands)
  * [Provision on Bluemix](#provision-on-bluemix)
  * [Hubot Adapter setup](#hubot-adapter-setup)
  * [Development](#development)

## Usage <a id="usage"></a>

If you are new to Hubot visit the [getting started](https://hubot.github.com/docs/) content to get a basic bot up and running.  Next, follow these steps for adding this external script into your hubot:

1. `cd` into your hubot directory
2. Install this package via `npm install @ibm/hubot-ibmcloud-script-skeleton --save`
3. Add `@ibm/hubot-ibmcloud-script-skeleton` to your `external-scripts.json`
4. Add the necessary environment variables:
```
export HUBOT_ENVIRNMENT_VARIABLE=<Variable Value>
```

5. Start up your bot & off to the races!


## Commands <a id="commands"></a>

- `hubot command` - command description.

## Provision on Bluemix <a id="provision-on-bluemix"></a>

Get a bot with these features and more up and running on the IBM Cloud.
Harness the power of ChatOps and control your cloud.

![Configure Hubot](/docs/images/Bluemix_Solutions.png)

Just step through a simple configuration wizard in order to provision your own bot on Bluemix.

Deploy your bot now by visiting [cloudbots.stage1.ng.bluemix.net](http://cloudbots.stage1.ng.bluemix.net/).

## Hubot Adapter setup <a id="hubot-adapter-setup"></a>

Hubot supports a variety of adapters to connect to popular chat clients.  For more feature rich experiences you can setup the following adapters:
- [Slack setup](./docs/adapters/slack.md)
- [Facebook Messenger setup](./docs/adapters/facebook.md)

## Development <a id="development"></a>

Please refer to the [CONTRIBUTING.md](./CONTRIBUTING.md) before starting any work.  Steps for running this script for development purposes:

### Configuration setup

- Create `config` folder in root of this project.
- create `env` in the `config` folder
- `env` contents:
```
export HUBOT_ENVIRNMENT_VARIABLE=<Variable Value>
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
 - [Slack: link to setup instructions](docs/adapters/slack.md)
 - [Facebook Messenger: link to setup instructions](docs/adapters/facebook.md)


## License

See [LICENSE.txt](./LICENSE.txt) for license information.

## Contribute

Please check out our [Contributing Guidelines](./CONTRIBUTING.md) for detailed information on how you can lend a hand.
