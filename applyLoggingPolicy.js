var pd = require('pretty-data').pd;
var fs=require('fs');
var xpath = require('xpath')
, dom = require('xmldom').DOMParser;
var logging =require('./messageLogging.js')
module.exports = {

    applyLoggingPolicy: function(data) {
        return new Promise((resolve, reject) => {

       
        var requestXml = fs.readFileSync('./apiproxy/proxies/default.xml','utf-8');
        //console.log(requestXml);
        var doc = new dom().parseFromString(requestXml);
        var nodes = xpath.select("//PostClientFlow", doc);
       if(nodes.length === 0) { /*This condition means there is no logging*/
        
        fs.writeFileSync('./apiproxy/policies/Message-Logging-1.xml', pd.xml(logging.data));
         nodes = xpath.select("//ProxyEndpoint", doc); //add message loggign after post flow closing tag
            requestXml = nodes[0].toString();
            requestXml = requestXml.replace('<ProxyEndpoint name="default">','');
            requestXml = '<PostClientFlow><Request/> <Response><Step><Name>Message-Logging-1</Name></Step></Response></PostClientFlow>' + requestXml;
             fs.writeFileSync('./apiproxy/proxies/default.xml',pd.xml('<?xml version="1.0" encoding="UTF-8" standalone="yes"?> <ProxyEndpoint name="default">'+ requestXml));
            resolve();
       }
        
    })
         
       

}
}

        
       