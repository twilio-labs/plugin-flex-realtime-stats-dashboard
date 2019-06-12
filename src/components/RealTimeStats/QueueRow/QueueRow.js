import React from "react";
import PropTypes from "prop-types";

import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import TableCell from "@material-ui/core/TableCell";
import TableRow from "@material-ui/core/TableRow";
import { RealTimeStatsCard } from "../RealTimeStatsCard";
import { CumulativeStatsCard } from "../CumulativeStatsCard";

export class QueueRow extends React.PureComponent {
  static propTypes = {
    queueItem: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    channel: PropTypes.string.isRequired,
    handleClick: PropTypes.func.isRequired,
    index: PropTypes.number.isRequired
  };
  render() {
    const { classes, queueItem, channel, index, handleClick } = this.props;

    const clickCallback = () => handleClick(queueItem, index);

    if (queueItem.sid) {
      const realTimeStats = queueItem["realTimeStats_" + channel];
      const cumulativeStats = queueItem["cumulativeStats_" + channel];
      const activities = realTimeStats.activityStatistics.reduce(
        (acc, activity) => {
          acc[activity.friendly_name] = activity.workers;
          return acc;
        },
        {}
      );

      return (
        <TableRow
          className={
            channel === "all" ? classes.tableRow : classes.tableRowChannel
          }
          onClick={clickCallback}
        >
          <TableCell className={classes.tableCell}>
            {channel === "all" ? (
              <CardContent>
                <Typography color="inherit">
                  {queueItem.friendlyName}
                </Typography>
              </CardContent>
            ) : (
              <CardContent>
                <Typography
                  color="inherit"
                  variant="caption"
                  gutterBottom
                  align="right"
                >
                  {" "}
                  - {channel}
                </Typography>
              </CardContent>
            )}
          </TableCell>
          <TableCell className={classes.tableCell} colSpan={2}>
            <RealTimeStatsCard classes={classes} {...realTimeStats} />
          </TableCell>
          <TableCell className={classes.tableCell} colSpan={4}>
            {cumulativeStats ? (
              <CumulativeStatsCard classes={classes} {...cumulativeStats} />
            ) : (
              <CardContent>
                <div align="center">
                  <Typography color="inherit"> NO DATA </Typography>
                </div>
              </CardContent>
            )}
          </TableCell>
          <TableCell className={classes.tableCell} colSpan={2} align="center">
            <CardContent>
              <div className={classes.cardrow}>
                <div align="left" className={classes.cardcolumn}>
                  {Object.keys(activities).map(key => (
                    <Typography color="inherit">
                      {key.toUpperCase()} :
                    </Typography>
                  ))}
                  <Typography color="inherit">ELIGIBLE:</Typography>
                </div>
                <div align="right" className={classes.cardcolumn}>
                  {Object.values(activities).map(value => (
                    <Typography color="inherit">{value}</Typography>
                  ))}
                  <Typography color="inherit">
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
            <Typography color="inherit"> Loading .... </Typography>
          </TableCell>
        </TableRow>
      );
    }
  }
}
