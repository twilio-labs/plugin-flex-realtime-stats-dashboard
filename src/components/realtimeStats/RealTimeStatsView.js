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
import { RealTimeStatsCard } from '../RealTimeStatsCard/RealTimeStatsCard'

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
  state = {
    websocketStatus: "closed",
    queueStats: [{}]
  };
  retryInterval;
  webSocket = null;
  rowsExpandedMap = new Map();

  componentDidMount() {
    console.log("mounting realtimeStats");
    this.initWebSocket();

    this.retryInterval = setInterval(
      () => {
        if (
          this.webSocket &&
          this.webSocket.readyState === this.webSocket.CLOSED
        ) {
          this.initWebSocket();
        }
      },
      10000
    );
  }

  componentWillUnmount() {
    this.webSocket.close();
    clearTimeout(this.retryInterval);
  }

  initWebSocket() {
    const { backendHostname } = this.props;

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
        const data = JSON.parse(message.data);
        this.setState({
          queueStats: data
        });
      } catch (error) {
        console.log(error);
        console.warn("Unrecognized payload: ", message.data);
      }
    }.bind(this);
  }


  renderRealtimeStatsCard(rtsData) {
    const { classes } = this.props;

    // total tasks needs to be calculated because the total tasks returned
    // from the API includes tasks the have been cancelled / abanonded and
    // sit around for 5 minutes before being cleared up
    const totaTasks =
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

  handleRowClick(queueItem) {
    const expanded = this.rowsExpandedMap.get(queueItem.sid);

    if (expanded) {
      this.rowsExpandedMap.set(queueItem.sid, false);
    } else {
      this.rowsExpandedMap.set(queueItem.sid, true);
    }

    this.forceUpdate();
  };

  renderStatsForChannel(queueItem, index, channel) {
    const activities = {};
    const { classes } = this.props;

    const clickCallback = () => this.handleRowClick(queueItem, index);

    if (queueItem.sid) {
      queueItem["realTimeStats_" + channel].activityStatistics.forEach(
        activity => {
          activities[activity.friendly_name] = activity.workers;
        }
      );

      const cumulativeStats = queueItem["cumulativeStats_" + channel];

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
            { !!cumulativeStats
              ? (
                <RealTimeStatsCard
                  {...cumulativeStats}
                  classes={this.props.classes}
                />
              )
              : (
                <CardContent>
                  <div align="center">
                    <Typography> NO DATA </Typography>
                  </div>
                </CardContent>
              )}
          </TableCell>
          <TableCell className={classes.tableCell} colSpan={2} align="center">
            <CardContent>
              <div className={classes.cardrow}>
                <div align="left" className={classes.cardcolumn}>
                  {Object.keys(activities).map(key => {
                    return <Typography>{key.toUpperCase()} :</Typography>;
                  })}
                  <Typography>ELIGIBLE:</Typography>
                </div>
                <div align="right" className={classes.cardcolumn}>
                  {Object.values(activities).map(value => {
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
    const { classes } = this.props;
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
              const tableArray = [];
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
