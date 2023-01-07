# homebridge-airmega

Control and monitor your Airmega purifier with HomeKit.

[![npm version](http://img.shields.io/npm/v/@ohmantics/homebridge-airmega.svg)](https://npmjs.org/package/@ohmantics/homebridge-airmega) [![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)

## Functionality

* Control power, fan speed, and lights
* Toggle between manual and auto mode
* Reports the current air quality
* Reports the life levels and change indication for the pre-filter and Max2 filter.

## Prerequisites

* Installation of [Homebridge](https://github.com/nfarina/homebridge)
* iOS 11 or later
* Airmega AP-1512HHS, 300S, or 400S connected to WiFi and registered with the IOCare app.

## Installation

```
npm install -g homebridge-airmega
```

## Configuration

Use the plugin [settings pane](https://www.npmjs.com/package/homebridge-config-ui-x) or add the following to your homebridge config:

```
"platforms": [
  {
    "platform": "Airmega",
    "username": "myusername",
    "password": "password123"
  }
]
```

### Excluding Accessories

You can optionally prevent certain accessories from being created by using the `exclude` option in your config (note: only the lightbulb accessory supports exclusion for now).

Example:

```
"platforms": [
  {
    "platform": "Airmega",
    "username": "myusername",
    "password": "password123",
    "exclude": [
      "lightbulb"
    ]
  }
]
```

### Authentication

The IOCare app offers two main options for logging in: "Phone Number/Email" or "Coway ID". The username and password you supply in the config has been tested to work with either one. This plugin currently does not support authentication through social networks.

## Tested Siri Commands

Example of some Siri commands you can use:

* "Turn on the air purifier"
* "Turn off the air purifier lights"
* "Set the air purifier to auto"
* "Set the air purifier fan to medium"
* "What's the air quality in \<room name\>?"

## Notes

* If you have a 250S, IconS, or other models not listed above, we'd like to [hear](https://github.com/ohmantics/homebridge-airmega/issues) from you.
* The Coway servers will ask you to change your password every 60 days. The plugin always defers that request.
* HomeKit will only display the status of one filter per purifier in the accessory details. It appears to choose randomly which filter it shows, however the filter change notification will appear if any filter needs changing. We've filed feedback with Apple to improve this.