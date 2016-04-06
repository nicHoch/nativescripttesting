"use strict";



var Loki = require("nativescript-loki");
//var theCragDB; 


global.initDB = function initDB(user) {
    console.log("start loki");
     
    var filename = "theCragLokiDB"+user+".json";
    console.log("start loki: "+filename);
    // Setup Loki 
    var theCragDB = new Loki(filename, { 
        autosave: true,
        autoload: true,
        autoloadCallback: function () {
    
                        var tasks = theCragDB.getCollection('tasks');
                        if (!tasks) {
                            tasks = theCragDB.addCollection('tasks');
                            
                            theCragDB.saveDatabase();
                            console.log("DB add tasks ");
                        }
                        
                        var user = theCragDB.getCollection('user');
                        if (!user) {
                            user = theCragDB.addCollection('user');
                            
                            theCragDB.saveDatabase();
                            console.log("DB add user ");
                        }
                        
                        var lastuser = user.find();
                        if (lastuser.length > 0) global.user = lastuser[0];
                         
                        var topos = theCragDB.getCollection('topos');
                        if (!topos) {
                            var td = require("~/www/topodata.json"); 
                            
                            topos = theCragDB.addCollection('topos', {indices: ['id']});
                            topos.ensureUniqueIndex("id"); 
                            topos.insert(td.topos);
                            
                            console.log("DB add topos"); 
                            theCragDB.saveDatabase();
                        }
                        
                        global.theCragDB = {
                            theCragDB: theCragDB,
                            topos: topos,  
                            tasks: tasks,
                            user: user
                        } 
                        
                        console.log("LOKI INIT Done");   
                        
                    }
   });
}
 

