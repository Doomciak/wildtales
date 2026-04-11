// Run these startup imports before the app mounts.
// They enable gesture handling, random values, and background task registration.
import "react-native-gesture-handler";
import "react-native-get-random-values";

import { registerRootComponent } from "expo";

import "./features/safety/logic/locationTask";
import App from "./App";

registerRootComponent(App);