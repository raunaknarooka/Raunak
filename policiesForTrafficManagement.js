var pd = require('pretty-data').pd;
var fs=require('fs');
var quota = require('./quota.js');
var spikeArrest = require('./spikeArrest.js');
var xpath = require('xpath')
, dom = require('xmldom').DOMParser;
module.exports = {

    applyTrafficPolicies: function(data) {
        var requestXml = fs.readFileSync('./apiproxy/proxies/default.xml','utf-8');
        //console.log(requestXml);
        var doc = new dom().parseFromString(requestXml);
        
         var insertOptions = '';
         var nodes = xpath.select("//ProxyEndpoint//PreFlow//Request", doc);
         requestXml = nodes[0].toString();
        
        return new Promise((resolve, reject) => {
            if (data.SpikeArrest === 'yes') {
                if(requestXml.indexOf('<Name>Spike-Arrest-1</Name>') === -1) {
               
                insertOptions =  '<Step><Name>Spike-Arrest-1</Name></Step>';
                fs.writeFileSync('./apiproxy/policies/Spike-Arrest-1.xml', pd.xml(spikeArrest.data));
                }
                
                
            }

            if (data.Quota === 'yes') {
                if (requestXml.indexOf('<Name>Quota-1</Name>') === -1) {
                insertOptions =  insertOptions + '<Step><Name>Quota-1</Name></Step>';
                fs.writeFileSync('./apiproxy/policies/Quota-1.xml', pd.xml(quota.data));
                }
                
                
            }
            if (requestXml.indexOf("<Request/>") !== -1) {
                requestXml = '<Request>' + insertOptions + '</Request>';
                } else {
                    requestXml = requestXml.slice(0,9) + insertOptions + requestXml.slice(9);
                }
            fs.writeFileSync('./apiproxy/proxies/default.xml',pd.xml('<?xml version="1.0" encoding="UTF-8" standalone="yes"?> <ProxyEndpoint name="default"><Description/><FaultRules/><PreFlow name="PreFlow">'+ requestXml + '<Response/></PreFlow><PostFlow name="PostFlow"><Request/><Response/></PostFlow><Flows/><HTTPProxyConnection><BasePath>'+data.Alias+'</BasePath><Properties/><VirtualHost>default</VirtualHost><VirtualHost>secure</VirtualHost></HTTPProxyConnection><RouteRule name="default"><TargetEndpoint>default</TargetEndpoint></RouteRule></ProxyEndpoint>'));
            resolve();
        })
       

}
}

        
       