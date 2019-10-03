# plugin-flex-realtime-stats-dashboard

This plugin is intended to demonstrate how a realtime dashboard might be setup using a backend service with websocket approach. The backend service can poll the statistics APIs and then clients can subscribe to the updates via a websocket managed by the backend. In a large system this could scale out using a persistence layer that stores the updates with multiple nodes providing access to websockets that retrieve from this persistence layer.

The backend system is available [here](https://github.com/jhunter-twilio/twilio-flex-sample-backend) and can rapidly be deployed to heroku using the link provided or setup locally with ngrok.

It also supports toggling to a twilio functions and twilio sync "backend" instead of the websocket backend, but this is less scalable and doesn't support reliable continuous updates for task aging. At most it will support 20 queues with no channel specific data, or 5 queues with channel specific data for voice, chat, video and all channels (5x4=20). The limit is enforced by the concurrent updates that can be pushed to the sync service.

# screenshot

![alt text](https://github.com/jhunter-twilio/plugin-flex-realtime-stats-dashboard/blob/master/screenshots/stats-view.gif)

# use

This plugin can be used with either   
(a) A custom backend solution written in node.js that supports a websocket with authentication - this design is suitable for production but relies on the provided backend being available  
  
(b) twilio functions and twilio sync - this has scalability limitations and without an external scheduler can't ensure changes to dashboard as tasks age - this is not suitable for production without an external scheduler instead of task router event call back

# Setting up with a custom backend (recommended)

1. Create backend system by following the instructions provided [here](https://github.com/jhunter-twilio/twilio-flex-sample-backend/blob/master/README.md)
2. Create a clone of this repository and update
   - the line referencing the [backend](https://github.com/jhunter-twilio/plugin-flex-realtime-stats-dashboard/blob/eea37c0a838c5e0f60a20098cc67002b3b8444af/src/FlexRealtimeStatsDashboardPlugin.js#L13)
3. run npm install
4. create your own public/appConfig.js based on the public/appConfig.example.js and include your own account number
5. run npm start

# Setting up with Twilio Functions and Twilio Sync

1. create a twilio function on your flex twilio account and name it realtimestats-updateQueueStatistics. Copy the contents of [this](https://github.com/jhunter-twilio/plugin-flex-realtime-stats-dashboard/blob/master/functions/realtimestats-updateQueueStatistics.js) function into it
   - uncheck the box that says "Check for valid Twilio Signature" and save it.
   - You should now have a function path like https://\<runtime-domain\>/realtimestats-updateQueueStatistics
2. execute your function from the browser with the parameter checkMap=true
   e.g. https://\<runtime-domain\>/realtimestats-updateQueueStatistics?checkMap=true
   - you can now optionally enable "check for valid twilio signature" again
3. Head to twilio/console -> task router -> select your flex workspace -> select settings
   - under "EVENT CALLBACK URL" copy the path of your twilio function e.g.
     https://\<runtime-domain\>/realtimestats-updateQueueStatistics
   - select all call back events
   - save
4. create a clone of this repository and update the variable USE_TWILIO_FUNCTIONS to true, this is in FlexRealTimeStatsDashboardPlugin.js
5. run npm install
6. create your own public/appConfig.js based on the public/appConfig.example.js and include your own account number
7. run npm start

# change log

v1.2 - updated to support optional use of twilio functions with sync map instead of a backend.

v1.1 - updated to flexui 1.9.1, fixed bug where adding a queue caused a fatal error

v1.0 - initial release with flex-ui 1.8.2 (material-ui v 1.5.2)

## Code of Conduct

Please be aware that this project has a [Code of Conduct](https://github.com/twilio-labs/.github/blob/master/CODE_OF_CONDUCT.md). The tldr; is to just be excellent to each other ❤️

# TODOs
