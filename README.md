# Extra Chicken - An unofficial Chipotle API wrapper
Extra chicken is an unofficial Chipotle API wrapper that allows you to programatically interact
with the Chipotle website to view stores, menus, place orders, and more.

## Table of Contents
[Installation](#Installation)

[Usage Examples](#Usage-Examples)

## Installation 
`npm install extra-chicken`

## Usage Examples
### Initialize Chipotle Object
```
import Chipotle = require('extra-chicken/dist')

// creates a non-headless puppeteer instance that logs into the Chipotle site with the specified credentials
const chip = await Chipotle.create("account-email@gmail.com", "account-password", false)
```

