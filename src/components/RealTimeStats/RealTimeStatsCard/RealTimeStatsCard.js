import React from "react";
import PropTypes from "prop-types";

import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";

export class RealTimeStatsCard extends React.PureComponent {
  static propTypes = {
    tasksByStatus: PropTypes.shape({
      pending: PropTypes.number.isRequired,
      assigned: PropTypes.number.isRequired,
      reserved: PropTypes.number.isRequired,
      wrapping: PropTypes.number.isRequired
    }).isRequired,
    oldestTask: PropTypes.number.isRequired,
    classes: PropTypes.object.isRequired
  };

  render() {
    const { classes, tasksByStatus, oldestTask } = this.props;

    // total tasks needs to be calculated because the total tasks returned
    // from the API includes tasks the have been cancelled / abanonded and
    // sit around for 5 minutes before being cleared up
    const totalTasks =
      tasksByStatus.pending +
      tasksByStatus.assigned +
      tasksByStatus.reserved +
      tasksByStatus.wrapping;

    return (
      <CardContent>
        <div className={classes.cardrow}>
          <div className={classes.cardrow}>
            <div className={classes.cardrow}>
              <div align="left" className={classes.cardcolumn}>
                <Typography color="inherit">PENDING :</Typography>
                <Typography color="inherit">ASSIGNED:</Typography>
                <Typography color="inherit">RESERVED:</Typography>
                <Typography color="inherit">WRAPPING:</Typography>
              </div>
              <div align="right" className={classes.cardcolumn}>
                <Typography color="inherit">{tasksByStatus.pending}</Typography>
                <Typography color="inherit">
                  {tasksByStatus.assigned}
                </Typography>
                <Typography color="inherit">
                  {tasksByStatus.reserved}
                </Typography>
                <Typography color="inherit">
                  {tasksByStatus.wrapping}
                </Typography>
              </div>
            </div>
          </div>
          <div align="center" className={classes.cardcolumn}>
            <Typography color="inherit">TOTAL</Typography>
            <Typography color="inherit" component="h1">
              {totalTasks}
            </Typography>
            <Typography color="inherit">OLDEST</Typography>
            <Typography color="inherit" component="h1">
              {oldestTask}
            </Typography>
          </div>
        </div>
      </CardContent>
    );
  }
}
