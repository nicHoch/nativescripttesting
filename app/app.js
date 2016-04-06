var application = require("application");
var LocalNotifications = require("nativescript-local-notifications");
require( "nativescript-orientation" );
require( "nativescript-dom" );
require( "~/shared/util/theCragDB" );
require( "~/shared/util/util" );

var filters = require("~/shared/util/filters");

console.log("Start");

initDB("");


application.on(application.launchEvent, function (args) {
    if (args.android) {
        // For Android applications, args.android is an android.content.Intent class.
        console.log("Launched Android application with the following intent: " + args.android + ".");
    } else if (args.ios !== undefined) {
        // For iOS applications, args.ios is NSDictionary (launchOptions).
        console.log("Launched iOS application with options: " + args.ios);
    }
});

application.on(application.suspendEvent, function (args) {
    if (args.android) {
        // For Android applications, args.android is an android activity class.
        console.log("Activity: " + args.android);
    } else if (args.ios) {
        // For iOS applications, args.ios is UIApplication.
        console.log("UIApplication: " + args.ios);
    }
    global.theCragDB.theCragDB.saveDatabase();
});

application.on(application.resumeEvent, function (args) {
    if (args.android) {
        // For Android applications, args.android is an android activity class.
        console.log("Activity: " + args.android);
    } else if (args.ios) {
        // For iOS applications, args.ios is UIApplication.
        console.log("UIApplication: " + args.ios);
    }
});

application.on(application.exitEvent, function (args) {
    if (args.android) {
        // For Android applications, args.android is an android activity class.
        console.log("Activity: " + args.android);
    } else if (args.ios) {
        // For iOS applications, args.ios is UIApplication.
        console.log("UIApplication: " + args.ios);
    }
    
    global.theCragDB.theCragDB.saveDatabase();
});

application.on(application.lowMemoryEvent, function (args) {
    if (args.android) {
        // For Android applications, args.android is an android activity class.
        console.log("Activity: " + args.android);
    } else if (args.ios) {
        // For iOS applications, args.ios is UIApplication.
        console.log("UIApplication: " + args.ios);
    }
});

application.on(application.uncaughtErrorEvent, function (args) {
    if (args.android) {
        // For Android applications, args.android is an NativeScriptError.
        console.log("NativeScriptError: " + args.android);
    } else if (args.ios) {
        // For iOS applications, args.ios is NativeScriptError.
        console.log("NativeScriptError: " + args.ios);
    }
}); 

global.filters = filters;
for (var property in filters) {
    if (filters.hasOwnProperty(property)) {
        application.resources[property] = filters[property];
    }
}

global.setNotification = function(title, body) {
     LocalNotifications.schedule([{
      id: 1,
      title: title,
      body: body,
      sound: null
    }]).then(
        function() {
          console.log("set Notification: "+body);
        },
        function(error) {
          console.log("Notification Schedule error: " + error);
        }
    );
}


application.mainModule = "views/main/main-page";
application.start();

