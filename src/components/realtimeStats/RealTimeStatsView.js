import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";

import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";

import CardContent from "@material-ui/core/CardContent";

import Typography from "@material-ui/core/Typography";

import { Notifications, Manager } from "@twilio/flex-ui";

const styles = theme => ({
  //table
  tableroot: {
    width: "100%",
    margin: theme.spacing.unit * 1,
    overflowX: "auto"
  },
  tableCellHeader: {
    backgroundColor: theme.palette.grey[900],
    color: theme.palette.common.white,
    variant: "head",
    border: "1px solid white",
    position: "sticky",
    top: 0
  },
  table: {
    minWidth: 700
  },
  tableCell: {
    border: "1px solid " + theme.palette.grey[300]
  },
  tableRow: {
    minHeight: "124px"
  },
  tableRowChannel: {
    minHeight: "100px",
    backgroundColor: theme.palette.grey[200]
  },
  //rts
  cardrow: {
    minWidth: "145px",
    display: "flex",
    justifyContent: "space-between"
  },
  cardcolumn: {
    marginRight: "8px",
    marginLeft: "8px",
    flexDirection: "column"
  }
});

export class RealTimeStatsView extends React.Component {
  constructor() {
    super();

    this.state = {
      websocketStatus: "closed",
      queueStats: [{}]
    };

    this.retryInterval;
    this.webSocket = null;
    this.rowsExpandedMap = new Map();
  }

  componentDidMount() {
    console.log("mounting realtimeStats");
    this.initWebSocket();

    this.retryInterval = setInterval(
      function() {
        if (
          this.webSocket &&
          this.webSocket.readyState === this.webSocket.CLOSED
        ) {
          this.initWebSocket();
        }
      }.bind(this),
      10000
    );
  }

  componentWillUnmount() {
    this.webSocket.close();
    clearTimeout(this.retryInterval);
  }

  initWebSocket() {
    var { backendHostname } = this.props;

    this.webSocket = new WebSocket(
      "wss://" + backendHostname + "/websocket/realtimeStats",
      Manager.getInstance().user.token
    );

    this.webSocket.onerror = function() {
      Notifications.showNotification("WebsocketError", {
        url: backendHostname
      });
    };

    this.webSocket.onopen = function() {
      this.setState({ websocketStatus: "open" });
    }.bind(this);

    this.webSocket.onclose = function() {
      this.setState({ websocketStatus: "closed" });
    }.bind(this);

    this.webSocket.onmessage = function(message) {
      try {
        var data = JSON.parse(message.data);
        this.setState({
          queueStats: data
        });
      } catch (error) {
        console.log(error);
        console.warn("Unrecognized payload: ", message.data);
      }
    }.bind(this);
  }

  renderCumulativeStatsCard(cumulativeData) {
    var { classes } = this.props;

    if (cumulativeData) {
      var splitByWait = [];

      var measuredTime = new Date(null);
      measuredTime.setSeconds(cumulativeData.avgTaskAcceptanceTime);
      var averageAcceptTime = measuredTime.toISOString().substr(11, 8);

      measuredTime = new Date(null);
      measuredTime.setSeconds(cumulativeData.waitUntilCancel.avg);
      var averageCancelTime = measuredTime.toISOString().substr(11, 8);

      // setup a more dynamically usable splitbywaittime
      // percentage is calls Acceptedbelow / ( CallsAccepted(below + above) + CallsAbandoned Above threshold)
      for (const attribute in cumulativeData.splitByWaitTime) {
        var totalAccepted =
          cumulativeData.splitByWaitTime[attribute].above
            .reservations_accepted +
          cumulativeData.splitByWaitTime[attribute].below
            .reservations_accepted +
          cumulativeData.splitByWaitTime[attribute].above.tasks_canceled;

        splitByWait.push({
          threshold: attribute,
          value: cumulativeData.splitByWaitTime[attribute],
          acceptedPercentage:
            totalAccepted > 0
              ? Math.round(
                  (cumulativeData.splitByWaitTime[attribute].below
                    .reservations_accepted /
                    totalAccepted) *
                    100
                ) + "%"
              : "-"
        });
      }

      return (
        <CardContent>
          <div className={classes.cardrow}>
            <div className={classes.cardrow}>
              <div className={classes.cardrow}>
                <div align="left" className={classes.cardcolumn}>
                  <Typography>CREATED :</Typography>
                  <Typography>COMPLETED:</Typography>
                  <Typography>ABANDONED:</Typography>
                  <Typography>MOVED :</Typography>
                </div>
                <div align="right" className={classes.cardcolumn}>
                  <Typography>{cumulativeData.tEnter}</Typography>
                  <Typography>{cumulativeData.tCompl}</Typography>
                  <Typography>{cumulativeData.tCanc}</Typography>
                  <Typography>{cumulativeData.tMoved}</Typography>
                </div>
              </div>
            </div>
            <div align="center" className={classes.cardcolumn}>
              <Typography>AVG ACCEPT</Typography>
              <Typography component="h1">{averageAcceptTime}</Typography>
              <Typography>AVG ABANDON</Typography>
              <Typography component="h1">{averageCancelTime}</Typography>
            </div>
            <div align="center" className={classes.cardcolumn}>
              <Typography>SLA</Typography>
              <div align="center" className={classes.cardrow}>
                {splitByWait.map((item, index) => {
                  return <Typography>{item.threshold} sec </Typography>;
                })}
              </div>
              <div align="center" className={classes.cardrow}>
                {splitByWait.map((item, index) => {
                  return <Typography>{item.acceptedPercentage}</Typography>;
                })}
              </div>
            </div>
          </div>
        </CardContent>
      );
    } else {
      return (
        <CardContent>
          <div align="center">
            <Typography> NO DATA </Typography>
          </div>
        </CardContent>
      );
    }
  }

  renderRealtimeStatsCard(rtsData) {
    var { classes } = this.props;

    // total tasks needs to be calculated because the total tasks returned
    // from the API includes tasks the have been cancelled / abanonded and
    // sit around for 5 minutes before being cleared up
    var totaTasks =
      rtsData.tasksByStatus.pending +
      rtsData.tasksByStatus.assigned +
      rtsData.tasksByStatus.reserved +
      rtsData.tasksByStatus.wrapping;

    return (
      <CardContent>
        <div className={classes.cardrow}>
          <div className={classes.cardrow}>
            <div className={classes.cardrow}>
              <div align="left" className={classes.cardcolumn}>
                <Typography>PENDING :</Typography>
                <Typography>ASSIGNED:</Typography>
                <Typography>RESERVED:</Typography>
                <Typography>WRAPPING:</Typography>
              </div>
              <div align="right" className={classes.cardcolumn}>
                <Typography>{rtsData.tasksByStatus.pending}</Typography>
                <Typography>{rtsData.tasksByStatus.assigned}</Typography>
                <Typography>{rtsData.tasksByStatus.reserved}</Typography>
                <Typography>{rtsData.tasksByStatus.wrapping}</Typography>
              </div>
            </div>
          </div>
          <div align="center" className={classes.cardcolumn}>
            <Typography>TOTAL</Typography>
            <Typography component="h1">{totaTasks}</Typography>
            <Typography>OLDEST</Typography>
            <Typography component="h1">{rtsData.oldestTask}</Typography>
          </div>
        </div>
      </CardContent>
    );
  }

  handleRowClick = function(queueItem, index) {
    var expanded = this.rowsExpandedMap.get(queueItem.sid);

    if (expanded) {
      this.rowsExpandedMap.set(queueItem.sid, false);
    } else {
      this.rowsExpandedMap.set(queueItem.sid, true);
    }

    this.forceUpdate();
  };

  renderStatsForChannel(queueItem, index, channel) {
    var activities = {};
    var { classes } = this.props;

    var clickCallback = () => this.handleRowClick(queueItem, index);

    if (queueItem.sid) {
      queueItem["realTimeStats_" + channel].activityStatistics.forEach(
        activity => {
          activities[activity.friendly_name] = activity.workers;
        }
      );
      return (
        <TableRow
          className={
            channel === "all" ? classes.tableRow : classes.tableRowChannel
          }
          key={index}
          onClick={clickCallback}
        >
          <TableCell className={classes.tableCell}>
            {channel === "all" ? (
              <CardContent>
                <Typography>{queueItem.friendlyName}</Typography>
              </CardContent>
            ) : (
              <CardContent>
                <Typography variant="caption" gutterBottom align="right">
                  {" "}
                  - {channel}
                </Typography>
              </CardContent>
            )}
          </TableCell>
          <TableCell className={classes.tableCell} colSpan={2}>
            {this.renderRealtimeStatsCard(
              queueItem["realTimeStats_" + channel]
            )}
          </TableCell>
          <TableCell className={classes.tableCell} colSpan={4}>
            {this.renderCumulativeStatsCard(
              queueItem["cumulativeStats_" + channel]
            )}
          </TableCell>
          <TableCell className={classes.tableCell} colSpan={2} align="center">
            <CardContent>
              <div className={classes.cardrow}>
                <div align="left" className={classes.cardcolumn}>
                  {Object.keys(activities).map(key => {
                    console.log("key is", key);
                    return <Typography>{key.toUpperCase()} :</Typography>;
                  })}
                  <Typography>ELIGIBLE:</Typography>
                </div>
                <div align="right" className={classes.cardcolumn}>
                  {Object.values(activities).map(value => {
                    console.log("value is", value);
                    return <Typography>{value}</Typography>;
                  })}
                  <Typography>
                    {queueItem["realTimeStats_" + channel].eligibleWorkers}
                  </Typography>
                </div>
              </div>
            </CardContent>
          </TableCell>
        </TableRow>
      );
    } else {
      return (
        <TableRow>
          <TableCell align="center" colSpan={9}>
            <Typography> Loading .... </Typography>
          </TableCell>
        </TableRow>
      );
    }
  }

  render() {
    var { classes } = this.props;
    return (
      <Paper className={classes.tableroot}>
        <Table className={classes.table}>
          <TableHead>
            <TableRow>
              <TableCell align="center" className={classes.tableCellHeader}>
                Queue Name
              </TableCell>
              <TableCell
                align="center"
                colSpan={2}
                className={classes.tableCellHeader}
              >
                Tasks (In Queue)
              </TableCell>
              <TableCell
                align="center"
                colSpan={4}
                className={classes.tableCellHeader}
              >
                Tasks (Today)
              </TableCell>
              <TableCell
                align="center"
                colSpan={2}
                className={classes.tableCellHeader}
              >
                Agents
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {this.state.queueStats.map((queueItem, index) => {
              var tableArray = [];
              tableArray.push(
                this.renderStatsForChannel(queueItem, index, "all")
              );
              if (this.rowsExpandedMap.get(queueItem.sid)) {
                tableArray.push(
                  this.renderStatsForChannel(queueItem, index, "voice")
                );
                tableArray.push(
                  this.renderStatsForChannel(queueItem, index, "chat")
                );
                tableArray.push(
                  this.renderStatsForChannel(queueItem, index, "video")
                );
              }
              return tableArray;
            })}
          </TableBody>
        </Table>
      </Paper>
    );
  }
}

RealTimeStatsView.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(RealTimeStatsView);
