import React from "react";
import { FlexPlugin } from "flex-plugin";
import { SideLink, Actions } from "@twilio/flex-ui";
import { MainView } from "./components/MainView";

import "./notifications/CustomNotifications";

const PLUGIN_NAME = "FlexRealtimeStatsDashboardPlugin";

export default class FlexRealtimeStatsDashboardPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
    this.backendHostname = "twilio-flex-sample-backend.herokuapp.com";
  }

  /**
   * This code is run when your plugin is being started
   * Use this to modify any UI components or attach to the actions framework
   *
   * @param flex { typeof import('@twilio/flex-ui') }
   * @param manager { import('@twilio/flex-ui').Manager }
   */
  init(flex, manager) {
    flex.ViewCollection.Content.add(
      <flex.View name="RealTimeStatsView" key="realTimeStatsView">
        <MainView
          key="realTimeStatsViewComponent"
          backendHostname={this.backendHostname}
        />
      </flex.View>
    );

    flex.SideNav.Content.add(
      <SideLink
        key="RealTimeQueueStats"
        icon="Data"
        onClick={() =>
          Actions.invokeAction("NavigateToView", {
            viewName: "RealTimeStatsView"
          })
        }
      >
        Real Time Queue Stats
      </SideLink>
    );
  }
}
