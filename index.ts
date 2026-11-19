// Push notification handlers for when the app is in the background or closed
// have to be registered before the app loads.
import "./src/services/backgroundNotifications";
// Same for the periodic background check for new samples.
import "./src/services/sampleBackgroundTask";

// Must be imported last.
import "expo-router/entry";
