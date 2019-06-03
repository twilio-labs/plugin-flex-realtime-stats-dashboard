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
import { ChannelRow } from '../ChannelRow'

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
    border: "1px solid white",
    position: "sticky",
    top: 0,
    paddingTop: "12px",
    paddingBottom: "12px"
  },
  table: {
    minWidth: 700
  },
  tableCell: {
    border: "1px solid " + theme.colors.base2
  },
  tableRow: {
    minHeight: "124px",
    cursor: "pointer",
    transition: "background-color 0.1s",
    '&:hover': {
      backgroundColor: theme.colors.base2
    }
  },
  tableRowChannel: {
    minHeight: "100px",
    cursor: "default",
    backgroundColor: theme.colors.base3
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
    queueStats: [{}]
  };
  retryInterval;
  /** @type WebSocket */
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

  handleRowClick = (queueItem) => {
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
          <TableBody>
            {this.renderChannelRows()}
          </TableBody>
        </Table>
      </Paper>
    );
  }

  renderChannelRows() {
    const { classes } = this.props;
    return this.state.queueStats.map((queueItem) => {
      const sharedProps = {
        queueItem,
        classes,
        handleClick: this.handleRowClick,
      }
      const tableArray = [
        <ChannelRow channel="all" {...sharedProps} />
      ];
      if (this.rowsExpandedMap.get(queueItem.sid)) {
        tableArray.push(
          <ChannelRow channel="voice" {...sharedProps} />,
          <ChannelRow channel="chat" {...sharedProps} />,
          <ChannelRow channel="video" {...sharedProps} />
        );
      }
      return tableArray;
    });
  }
}

export const MainView = withStyles(styles)(MainViewImpl);
