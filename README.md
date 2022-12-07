# homebridge-airmega

Control and monitor your Airmega purifier with HomeKit.

[![npm version](http://img.shields.io/npm/v/@ohmantics/homebridge-airmega.svg)](https://npmjs.org/package/@ohmantics/homebridge-airmega)

## Functionality

* Control power, fan speed, and lights
* Toggle between manual and auto mode
* Reports the current air quality
* Reports the life levels and change indication for the pre-filter and Max2 filter.

## Prerequisites

* Installation of [Homebridge](https://github.com/nfarina/homebridge)
* iOS 11 or later
* Airmega 400S or 300S connected to WiFi and registered with the IOCare app

## Installation

```
npm install -g homebridge-airmega
```

## Configuration

Add the following to your homebridge config:

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
