import "react-native-gesture-handler";
import "react-native-get-random-values";

import { registerRootComponent } from "expo";

import "./features/safety/logic/locationTask";
import App from "./App";

// These imports need to run before the app starts
// so gesture handling and random value support are available globally.

// Import the background location task once at startup
// so Expo can register it before tracking is used.
registerRootComponent(App);