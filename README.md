# plugin-flex-realtime-stats-dashboard

This plugin is intended to demonstrate how a realtime dashboard might be setup using a backend service with websocket approach.  The backend service can poll the statistics APIs and then clients can subscribe to the updates via a websocket managed by the backend.  In a large system this could scale out using a persistence layer that stores the updates with multiple nodes providing access to websockets that retrieve from this persistence layer.

The backend system is available [here](https://github.com/jhunter-twilio/twilio-flex-sample-backend) and can rapidly be deployed to heroku using the link provided or setup locally with ngrok.

# screenshot

![alt text](https://github.com/jhunter-twilio/plugin-flex-realtime-stats-dashboard/blob/master/screenshots/stats-view.png)

# use

1. Create backend system by following the instructions provided [here](https://github.com/jhunter-twilio/twilio-flex-sample-backend/blob/master/README.md)
2. Create a clone of this repository and update
   - the line referencing the [backend](https://github.com/jhunter-twilio/plugin-flex-realtime-stats-dashboard/blob/eea37c0a838c5e0f60a20098cc67002b3b8444af/src/FlexRealtimeStatsDashboardPlugin.js#L13)
3. run npm install
4. create your own public/appConfig.js based on the public/appConfig.example.js and include your own account number
5. run npm start

# change log

v1.0 - initial release with flex-ui 1.8.2 (material-ui v 1.5.2)

# notes

the flex ui dependency was downgraded to compile with flex-ui 1.8, this is because later versions of flex use an upgraded version of material ui and as hosted flex is currently limited to 1.8.2 and no higher, we must use the material ui depdencies of 1.8.2.  In short, if you build this plugin with flexui higher than 1.8.2 it wont work with ealrier versions of flex-ui
