import React from "react"
import PropTypes from "prop-types"

import CardContent from "@material-ui/core/CardContent"
import Typography from "@material-ui/core/Typography"

export class RealTimeStatsCard extends React.PureComponent {
  static propTypes = {
    avgTaskAcceptanceTime: PropTypes.number.isRequired,
    waitUntilCancel: PropTypes.shape({
      avg: PropTypes.number.isRequired,
    }).isRequired,
    splitByWaitTime: PropTypes.objectOf(PropTypes.shape({
      above: PropTypes.shape({
        reservations_accepted: PropTypes.number.isRequired,
        tasks_canceled: PropTypes.number.isRequired,
      }),
      below: PropTypes.shape({
        reservations_accepted: PropTypes.number.isRequired,
        tasks_canceled: PropTypes.number.isRequired,
      }),
    })).isRequired,
    tEnter: PropTypes.number.isRequired,
    tCompl: PropTypes.number.isRequired,
    tCanc: PropTypes.number.isRequired,
    tMoved: PropTypes.number.isRequired,
    classes: PropTypes.object.isRequired,
  }

  render() {
    const {
      classes,
      splitByWaitTime,
      avgTaskAcceptanceTime,
      waitUntilCancel,
      tEnter,
      tCompl,
      tCanc,
      tMoved,
    } = this.props

    let measuredTime = new Date(null)
    measuredTime.setSeconds(avgTaskAcceptanceTime)
    const averageAcceptTime = measuredTime.toISOString().substr(11, 8)

    measuredTime = new Date(null)
    measuredTime.setSeconds(waitUntilCancel.avg)
    const averageCancelTime = measuredTime.toISOString().substr(11, 8)

    // setup a more dynamically usable splitbywaittime
    // percentage is calls Acceptedbelow / ( CallsAccepted(below + above) + CallsAbandoned Above threshold)
    const splitByWait = Object.keys(splitByWaitTime).map((threshold) => {
      const value = splitByWaitTime[threshold];
      const { above, below } = value;
      const totalAccepted = above.reservations_accepted + below.reservations_accepted + above.tasks_canceled

      return {
        threshold,
        value,
        acceptedPercentage:
          totalAccepted > 0
            ? `${Math.round(value.below.reservations_accepted / totalAccepted) * 100}%`
            : "-",
      }
    })


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
                <Typography>{tEnter}</Typography>
                <Typography>{tCompl}</Typography>
                <Typography>{tCanc}</Typography>
                <Typography>{tMoved}</Typography>
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
              {splitByWait.map((item, index) => (
                <Typography key={index}>{item.threshold} sec </Typography>
              ))}
            </div>
            <div align="center" className={classes.cardrow}>
              {splitByWait.map((item, index) => (
                <Typography key={index}>{item.acceptedPercentage}</Typography>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    )
  }
}