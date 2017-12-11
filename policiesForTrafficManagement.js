var pd = require('pretty-data').pd;
var fs=require('fs');
var quota = require('./quota.js');
var spikeArrest = require('./spikeArrest.js');
var responseCache = require('./responseCache.js');
var concurrentRateLimit = require('./concurrentRateLimit.js');

var xpath = require('xpath')
,  dom = require('xmldom').DOMParser;
module.exports = {

    applyTrafficPolicies: function(data) {
        var requestXml = fs.readFileSync('./apiproxy/proxies/default.xml','utf-8');
        //variable to attached the policy in response as well
        var requestXmlForResponse = fs.readFileSync('./apiproxy/targets/default.xml','utf-8');
       // console.log(requestXml);
        //console.log(requestXmlForResponse);
        var doc = new dom().parseFromString(requestXml);
        var docResponse = new dom().parseFromString(requestXmlForResponse);
        
         var insertOptions = '';
         var insertOptionsForResponse = '';
         var nodesForResponsePre = xpath.select("//TargetEndpoint//PreFlow//Request", docResponse);
         var nodesForResponsePost = xpath.select("//TargetEndpoint//PostFlow//Response", docResponse);
         var nodes = xpath.select("//ProxyEndpoint//PreFlow//Request", doc);
         requestXml = nodes[0].toString();
         requestXmlForResponsePre =  nodesForResponsePre[0].toString();
         requestXmlForResponsePost =  nodesForResponsePost[0].toString();
        
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

            if (data.Cache === 'yes') {
                if (requestXml.indexOf('<Name>Response-Cache-1</Name>') === -1) {
                    if ((requestXmlForResponsePost.indexOf('<Name>Response-Cache-1</Name>') === -1)) {
                    insertOptions =  insertOptions + '<Step><Name>Response-Cache-1</Name></Step>';
                    insertOptionsForResponse =  insertOptionsForResponse + '<Step><Name>Response-Cache-1</Name></Step>'; 
                fs.writeFileSync('./apiproxy/policies/Response-Cache-1.xml', pd.xml(responseCache.data));
                }
            }
                
                
            }
            if (data.ConcurrentRateLimit === 'yes') {
                if (requestXmlForResponsePre.indexOf('<Name>Concurrent-Rate-Limit-1</Name>') === -1) {
                    if ((requestXmlForResponsePost.indexOf('<Name>Concurrent-Rate-Limit-1</Name>') === -1)) {
                   // insertOptions =  insertOptions + '<Step><Name>Concurrent-Rate-Limit-1</Name></Step>';
                    insertOptionsForResponse =  insertOptionsForResponse + '<Step><Name>Concurrent-Rate-Limit-1</Name></Step>'; 
                fs.writeFileSync('./apiproxy/policies/Concurrent-Rate-Limit-1.xml', pd.xml(concurrentRateLimit.data));
                }
            }
                
                
            }
            if (requestXml.indexOf("<Request/>") !== -1) {
                requestXml = '<Request>' + insertOptions + '</Request>';
                } else {
                    requestXml = requestXml.slice(0,9) + insertOptions + requestXml.slice(9);
                }
           
                if (requestXmlForResponsePost.indexOf("<Response/>") !== -1) {
                    requestXmlForResponsePost = '<Response>' + insertOptionsForResponse + '</Response>';
                    //console.log("*****" + requestXmlForResponse);
                    } else {
                        requestXmlForResponsePost = requestXmlForResponsePost.slice(0,10) + insertOptionsForResponse + requestXmlForResponsePost.slice(10);
                       // console.log(requestXmlForResponse);
                    }

                 if (requestXmlForResponsePre.indexOf("<Request/>") !== -1) {
                        requestXmlForResponsePre = '<Request>' + insertOptionsForResponse + '</Request>';
                        //console.log("*****" + requestXmlForResponse);
                        } else {
                            requestXmlForResponsePre = requestXmlForResponsePre.slice(0,10) + insertOptionsForResponse + requestXmlForResponsePre.slice(10);
                           // console.log(requestXmlForResponse);
                        }
                    return new Promise((resolve, reject) => {
                         fs.writeFileSync('./apiproxy/proxies/default.xml',pd.xml('<?xml version="1.0" encoding="UTF-8" standalone="yes"?> <ProxyEndpoint name="default"><Description/><FaultRules/><PreFlow name="PreFlow">'+ requestXml + '<Response/></PreFlow><PostFlow name="PostFlow"><Request/><Response/></PostFlow><Flows/><HTTPProxyConnection><BasePath>'+data.Alias+'</BasePath><Properties/><VirtualHost>default</VirtualHost><VirtualHost>secure</VirtualHost></HTTPProxyConnection><RouteRule name="default"><TargetEndpoint>default</TargetEndpoint></RouteRule></ProxyEndpoint>'));
                         resolve();
                    }).then(()=> { 
                            fs.writeFileSync('./apiproxy/targets/default.xml',pd.xml('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><TargetEndpoint name="default"> <Description/> <FaultRules/> <Flows/><PreFlow name="PreFlow"> ' + requestXmlForResponsePre +' <Response/></PreFlow><PostFlow name="PostFlow"> <Request/> '+ requestXmlForResponsePost + ' </PostFlow><HTTPTargetConnection><Properties/> <URL>'+data.Url+'</URL></HTTPTargetConnection> </TargetEndpoint>'));
                            resolve();
                         })
                         resolve();
                         
                })
        

}
}

        
       