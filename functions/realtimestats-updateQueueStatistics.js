/*
 *  Written By: Jared Hunter
 *
 *  This function was written to list all queue stats for a flex workspace
 *  and push them to a sync map
 *
 *  on first run execute function with parameter checkMap=true e.g.
 *
 *  https://<runtime-domain>/realtimestats-updateQueueStatistics?checkMap=true
 *
 *  DEPENDENCIES: After creating function ensure environment variable is added
 *     TWILIO_FLEX_WORKSPACE_SID assign the value of your flex workspace
 *     TWILIO_FLEX_SYNC_SID assign the value of the sync service to map stats
 */

exports.handler = function(context, event, callback) {
  const client = context.getTwilioClient();
  const syncService = client.sync.services(context.TWILIO_FLEX_SYNC_SID);
  const response = new Twilio.Response();
  const MAP_NAME = "queueStats";
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

    if (errorMessages === "") {
      return true;
    } else {
      return false;
    }
  };

  const ensureSyncMapExists = function() {
    return new Promise(function(resolve, reject) {
      if (event.checkMap == "true") {
        syncService
          .syncMaps(MAP_NAME)
          .fetch()
          .then(() => {
            console.log("sync map existence confirmed"), resolve();
          })
          .catch(err => {
            console.log(err.message);
            console.log("creating sync map %s", MAP_NAME);
            syncService.syncMaps
              .create({ uniqueName: MAP_NAME })
              .then(sync_map => {
                console.log("sync map crated: " + sync_map.sid);
                resolve();
              })
              .catch(err => {
                console.log(err.message);
                resolve();
              });
          });
      } else {
        console.log("skipped check map");
        resolve();
      }
    });
  };

  function listQueues(twilioClient) {
    return new Promise(function(resolve, reject) {
      twilioClient.taskrouter
        .workspaces(process.env.TWILIO_FLEX_WORKSPACE_SID)
        .taskQueues.list()
        .then(result => {
          var queueArray = [];
          result.forEach(arrayItem => {
            queueArray.push({
              sid: arrayItem.sid,
              friendlyName: arrayItem.friendlyName
            });
          });
          resolve({ success: true, queueArray: queueArray });
        })
        .catch(err => {
          console.log("err message: ", err.message);
          resolve({ success: false, message: err.message });
        });
    });
  }

  function populateRealTimeStatsForQueueItem(
    twilioClient,
    queueItem,
    taskChannel
  ) {
    return new Promise(function(resolve, reject) {
      twilioClient.taskrouter
        .workspaces(process.env.TWILIO_FLEX_WORKSPACE_SID)
        .taskQueues(queueItem.sid)
        .realTimeStatistics()
        .fetch({ taskChannel: taskChannel ? taskChannel : undefined })
        .then(result => {
          taskChannel = !taskChannel ? "all" : taskChannel;
          var realTimeStats = minimizeRealTimeStats(result);
          queueItem["realTimeStats_" + taskChannel] = realTimeStats;
          resolve(queueItem);
        })
        .catch(err => {
          queueItem.realTimeStatsMessage = err.message;
          resolve(queueItem);
        });
    });
  }

  function populateCumulativeStatsForQueueItem(
    twilioClient,
    queueItem,
    taskChannel
  ) {
    var todaysDate = new Date();
    todaysDate.setHours(0, 0, 0, 0);
    return new Promise(function(resolve, reject) {
      twilioClient.taskrouter
        .workspaces(process.env.TWILIO_FLEX_WORKSPACE_SID)
        .taskQueues(queueItem.sid)
        .cumulativeStatistics()
        .fetch({
          taskChannel: taskChannel ? taskChannel : undefined,
          startDate: todaysDate,
          splitByWaitTime: "30,60,120"
        })
        .then(result => {
          taskChannel = !taskChannel ? "all" : taskChannel;
          queueItem["cumulativeStats_" + taskChannel] = minimizeCumulativeStats(
            result
          );
          resolve(queueItem);
        })
        .catch(err => {
          queueItem.cumulativeStatsMessage = err.message;
          resolve(queueItem);
        });
    });
  }

  function minimizeRealTimeStats(realTimeStats) {
    if (realTimeStats) {
      var result = {};
      result.activityStatistics = [];

      realTimeStats.activityStatistics.forEach(activity => {
        result.activityStatistics.push({
          friendly_name: activity.friendly_name,
          workers: activity.workers
        });
      });

      result.oldestTask = realTimeStats.longestTaskWaitingAge;
      result.tasksByPriority = realTimeStats.tasksByPriority;
      result.tasksByStatus = realTimeStats.tasksByStatus;
      result.availableWorkers = realTimeStats.totalAvailableWorkers;
      result.eligibleWorkers = realTimeStats.totalEligibleWorkers;
      result.totalTasks = realTimeStats.totalTasks;

      return result;
    } else {
      return null;
    }
  }

  function minimizeCumulativeStats(cumulativeStatistics) {
    if (cumulativeStatistics) {
      var minimizedCumulativeStats = {
        rCreated: cumulativeStatistics.reservationsCreated,
        rRej: cumulativeStatistics.reservationsRejected,
        rAccepted: cumulativeStatistics.reservationsAccepted,
        rTimedOut: cumulativeStatistics.reservationsTimedOut,
        rCancel: cumulativeStatistics.reservationsCanceled,
        rRescind: cumulativeStatistics.reservationsRescinded,

        tCompl: cumulativeStatistics.tasksCompleted,
        tMoved: cumulativeStatistics.tasksMoved,
        tEnter: cumulativeStatistics.tasksEntered,
        tCanc: cumulativeStatistics.tasksCanceled,
        tDel: cumulativeStatistics.tasksDeleted,

        waitUntilCancel: cumulativeStatistics.waitDurationUntilCanceled,
        waitUntilAccept: cumulativeStatistics.waitDurationUntilAccepted,
        splitByWaitTime: cumulativeStatistics.splitByWaitTime,

        endTime: cumulativeStatistics.endTime,
        startTime: cumulativeStatistics.startTime,

        avgTaskAcceptanceTime: cumulativeStatistics.avgTaskAcceptanceTime
      };

      return minimizedCumulativeStats;
    } else {
      return null;
    }
  }

  const updateSyncMapItem = function(queueItem) {
    return new Promise(function(resolve, reject) {
      syncService
        .syncMaps(MAP_NAME)
        .syncMapItems(queueItem.sid)
        .update({ data: queueItem })
        .then(item => {
          //console.log("Item updated: " + queueItem.sid);
          resolve();
        })
        .catch(err => {
          console.log("retrying as create item");

          //retry the item as a create
          syncService
            .syncMaps(MAP_NAME)
            .syncMapItems.create({
              key: queueItem.sid,
              data: queueItem
            })
            .then(item => {
              console.log("Item created " + queueItem.sid);
              resolve();
            })
            .catch(err => {
              console.log(err.message);
              resolve();
            });
        });
    });
  };

  function fetchAllQueueStatistics(twilioClient) {
    // retrieves all queues for the environment configured workspace
    // then proceeds to fetch all stats data for them
    // returns an array of queue objects populated with the relevant stats nested on
    // the object
    return new Promise(function(resolve, reject) {
      listQueues(twilioClient).then(result => {
        if (result.success) {
          var queueResultsArray = result.queueArray;
          var getStatsPromiseArray = [];
          queueResultsArray.forEach(queueItem => {
            // Every cycle retreive realtime stats for all known channels
            // comment out the channel if it is not used,
            // to save on redundent calls to backend
            getStatsPromiseArray.push(
              populateRealTimeStatsForQueueItem(twilioClient, queueItem, null)
            );

            //get stats filtered by channel
            getStatsPromiseArray.push(
              populateRealTimeStatsForQueueItem(
                twilioClient,
                queueItem,
                "voice"
              )
            );
            getStatsPromiseArray.push(
              populateRealTimeStatsForQueueItem(twilioClient, queueItem, "chat")
            );
            getStatsPromiseArray.push(
              populateRealTimeStatsForQueueItem(
                twilioClient,
                queueItem,
                "video"
              )
            );

            //Now get cumulative stats for each queue, broken down by channel
            getStatsPromiseArray.push(
              populateCumulativeStatsForQueueItem(twilioClient, queueItem, null)
            );

            getStatsPromiseArray.push(
              populateCumulativeStatsForQueueItem(
                twilioClient,
                queueItem,
                "voice"
              )
            );

            getStatsPromiseArray.push(
              populateCumulativeStatsForQueueItem(
                twilioClient,
                queueItem,
                "chat"
              )
            );

            getStatsPromiseArray.push(
              populateCumulativeStatsForQueueItem(
                twilioClient,
                queueItem,
                "video"
              )
            );
          });

          Promise.all(getStatsPromiseArray).then(values => {
            // execute all calls for stats in parallel
            resolve(queueResultsArray);
          });
        }
      });
    });
  }

  if (validateParameters(context, event)) {
    ensureSyncMapExists().then(() => {
      fetchAllQueueStatistics(client).then(queueStatsArray => {
        var updateSyncMapPromiseArray = [];
        queueStatsArray.forEach(queueItem => {
          updateSyncMapPromiseArray.push(updateSyncMapItem(queueItem));
        });

        Promise.all(updateSyncMapPromiseArray).then(values => {
          response.setBody(queueStatsArray);
          callback(null, response);
        });
      });
    });
  } else {
    callback(null, { success: false, message: errorMessages });
  }
};
