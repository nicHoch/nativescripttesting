"use strict";

var connectivity = require("connectivity");

global.util = {
    
    getConnectionString : function() { 
        switch (connectivity.getConnectionType()) {
            case connectivity.connectionType.none:
                return "none";
            case connectivity.connectionType.wifi:
                return 'wifi';
            case connectivity.connectionType.mobile:
                return 'mobile';
        }
        return 'unknown';
    }
}