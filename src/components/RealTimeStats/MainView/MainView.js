import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";

import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";

import { Notifications, Manager } from "@twilio/flex-ui";
import { SyncClient } from "twilio-sync";
import { QueueRow } from "../QueueRow";

const styles = theme => ({
  //table
  tableroot: {
    width: "100%",
    margin: theme.spacing.unit * 1,
    overflowX: "auto"
  },
  tableCellHeader: {
    backgroundColor: theme.colors.base9,
    color: theme.colors.base1,
    variant: "head",
    border: "1px solid " + theme.colors.base1,
    position: "sticky",
    top: 0,
    paddingTop: "12px",
    paddingBottom: "12px"
  },
  table: {
    minWidth: 1050
  },
  tableCell: {
    border: "1px solid " + theme.colors.base6,
    color: "inherit"
  },
  tableRow: {
    minHeight: "124px",
    cursor: "pointer",
    transition: "background-color 0.1s",
    "&:hover": {
      backgroundColor: theme.colors.base4,
      color: theme.colors.base10
    }
  },
  tableRowChannel: {
    minHeight: "100px",
    cursor: "default",
    transition: "background-color 0.1s",
    "&:hover": {
      backgroundColor: theme.colors.base4,
      color: theme.colors.base10
    }
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

export class MainViewImpl extends React.Component {
  static propTypes = {
    classes: PropTypes.object.isRequired
  };

  state = {
    websocketStatus: "closed",
    queueStats: []
  };
  retryInterval;
  /** @type WebSocket */
  webSocket = null;
  rowsExpandedMap = new Map();

  componentDidMount() {
    const { useTwilioFunctions, queueStatsSyncMapName } = this.props;
    if (useTwilioFunctions) {
      console.log("mounting realtimeStats with twilio sync");
      this.initSyncMapClient(queueStatsSyncMapName);
    } else {
      console.log("mounting realtimeStats with websocket");
      this.initWebSocket();
      this.retryInterval = setInterval(() => {
        if (
          this.webSocket &&
          this.webSocket.readyState === this.webSocket.CLOSED
        ) {
          this.initWebSocket();
        }
      }, 10000);
    }
  }

  componentWillUnmount() {
    const { useTwilioFunctions } = this.props;
    if (useTwilioFunctions) {
      this.syncClient = null;
    } else {
      this.webSocket.close();
      clearTimeout(this.retryInterval);
    }
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

  syncMapPageHandler(paginator) {
    paginator.items.forEach(item => {
      this.syncMapHandleItemUpdate(item);
    });
    return paginator.hasNextPage
      ? paginator.nextPage().then(this.syncMapPageHandler)
      : null;
  }

  syncMapHandleItemUpdate(mapItem) {
    var dataMap = this.state.queueStats;
    var updated = false;
    console.log("DATAMAP", dataMap);
    console.log("mapItem", mapItem);
    dataMap.forEach((item, index) => {
      if (item.sid === mapItem.value.sid) {
        dataMap[index] = mapItem.value;
        updated = true;
      }
    });
    if (!updated) {
      dataMap.push(mapItem.value);
    }

    this.setState({ queueStats: dataMap });
  }

  initSyncMapClient(queueStatsSyncMapName) {
    // create syncClient on component mount
    this.syncClient = new SyncClient(Manager.getInstance().user.token);

    // fetch initial data map
    this.syncClient
      .map(queueStatsSyncMapName)
      .then(map => {
        map
          .getItems()
          .then(paginator => {
            this.syncMapPageHandler(paginator);
          })
          .catch(function(error) {
            console.error("Map getItems() failed", error);
          });
      })
      .catch(function(error) {
        Notifications.showNotification("SyncMapNotAvailable", {
          message: queueStatsSyncMapName
        });
      });

    // Add listener for future updates to existing items
    this.syncClient.map(queueStatsSyncMapName).then(map => {
      map.on("itemUpdated", args => {
        this.syncMapHandleItemUpdate(args.item);
      });
    });

    // Add listener for future additions to map
    this.syncClient.map(queueStatsSyncMapName).then(map => {
      map.on("itemAdded", args => {
        this.syncMapHandleItemUpdate(args.item);
      });
    });

    //TODO : add listener for removal of queue
    // need to handle removal from the sync map in the function first
  }

  handleRowClick = queueItem => {
    const expanded = this.rowsExpandedMap.get(queueItem.sid);

    if (expanded) {
      this.rowsExpandedMap.set(queueItem.sid, false);
    } else {
      this.rowsExpandedMap.set(queueItem.sid, true);
    }

    this.forceUpdate();
  };

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
          <TableBody>{this.renderChannelRows()}</TableBody>
        </Table>
      </Paper>
    );
  }

  renderChannelRows() {
    const { classes } = this.props;
    return this.state.queueStats.map(queueItem => {
      const sharedProps = {
        queueItem,
        classes,
        handleClick: this.handleRowClick
      };
      const tableArray = [<QueueRow channel="all" {...sharedProps} />];
      if (this.rowsExpandedMap.get(queueItem.sid)) {
        tableArray.push(
          <QueueRow channel="voice" {...sharedProps} />,
          <QueueRow channel="chat" {...sharedProps} />,
          <QueueRow channel="video" {...sharedProps} />
        );
      }
      return tableArray;
    });
  }
}

export const MainView = withStyles(styles)(MainViewImpl);
