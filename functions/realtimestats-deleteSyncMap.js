/*
 *  Written By: Jared Hunter
 *
 *  This function was written as a convenience function for tidying up a sync map
 *  e.g
 *  https://domain-runtime/realtimestats-deleteSyncMap?syncMapName=queueStats
 *
 *  DEPENDENCIES: After creating function ensure environment variable is added
 *     TWILIO_FLEX_WORKSPACE_SID assign the value of your flex workspace
 *     TWILIO_FLEX_SYNC_SID assign the value of the sync service to map stats
 */

exports.handler = function(context, event, callback) {
  const client = context.getTwilioClient();
  const syncService = client.sync.services(context.TWILIO_FLEX_SYNC_SID);
  const response = new Twilio.Response();
  var errorMessages;

  response.appendHeader("Access-Control-Allow-Origin", "*");
  response.appendHeader("Access-Control-Allow-Methods", "OPTIONS POST");
  response.appendHeader("Content-Type", "application/json");
  response.appendHeader("Access-Control-Allow-Headers", "Content-Type");

  const validateParameters = function(context, event) {
    errorMessages = "";
    errorMessages += context.TWILIO_FLEX_WORKSPACE_SID
      ? ""
      : "Missing TWILIO_FLEX_WORKSPACE_SID from context environment variables, ";
    errorMessages += context.TWILIO_FLEX_SYNC_SID
      ? ""
      : "Missing TWILIO_FLEX_SYNC_SID from context environment variables";
    errorMessages += event.syncMapName
      ? ""
      : "Missing parameter syncMapName: name of syncMap to delete";

    if (errorMessages === "") {
      return true;
    } else {
      return false;
    }
  };

  //log function parameters
  const entries = Object.entries(event);

  for (const [field, value] of entries) {
    console.log(`${field}, ${value}`);
  }

  if (validateParameters(context, event)) {
    syncService
      .syncMaps(event.syncMapName)
      .remove()
      .then(map => {
        console.log("Succesfully deleted map: " + event.syncMapName);
        response.setBody({ success: true });
        callback(null, response);
      })
      .catch(error => {
        console.log("error deleting map: " + event.syncMapName);
        response.setBody(error);
        callback(null, response);
      });
  } else {
    callback(null, { success: false, message: errorMessages });
  }
};
