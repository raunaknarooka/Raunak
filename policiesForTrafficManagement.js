var pd = require('pretty-data').pd;
var fs = require('fs');
var quota = require('./quota.js');
var spikeArrest = require('./spikeArrest.js');
var responseCache = require('./responseCache.js');
var concurrentRateLimit = require('./concurrentRateLimit.js');

var xpath = require('xpath')
    , dom = require('xmldom').DOMParser;
module.exports = {

    applyTrafficPolicies: function (data) {
        var requestXml = fs.readFileSync('./apiproxy/proxies/default.xml', 'utf-8');
        //variable to attached the policy in response as well
        var requestXmlForResponse = fs.readFileSync('./apiproxy/targets/default.xml', 'utf-8');
        var requestXmlForFaultRule = fs.readFileSync('./apiproxy/targets/default.xml', 'utf-8');
        // console.log(requestXml);
        //console.log(requestXmlForResponse);
        var doc = new dom().parseFromString(requestXml);
        var docResponse = new dom().parseFromString(requestXmlForResponse);

        var insertOptions = '';
        var insertOptionsForResponse = '';
        var insertOptionsForFaultRule = '';
         var insertOptionsForResponsePre = '';
        var nodesForFaultRule = xpath.select("//TargetEndpoint//FaultRules", docResponse);       
        var nodesForResponsePre = xpath.select("//TargetEndpoint//PreFlow//Request", docResponse);
        var nodesForResponsePost = xpath.select("//TargetEndpoint//PostFlow//Response", docResponse);
        var nodes = xpath.select("//ProxyEndpoint//PreFlow//Request", doc);
        requestXml = nodes[0].toString();
        requestXmlForResponsePre = nodesForResponsePre[0].toString();
        requestXmlForResponsePost = nodesForResponsePost[0].toString();
        requestXmlForFaultRule = nodesForFaultRule[0].toString();

        return new Promise((resolve, reject) => {
            if (data.SpikeArrest === 'yes') {
                if (requestXml.indexOf('<Name>Spike-Arrest-1</Name>') === -1) {

                    insertOptions = '<Step><Name>Spike-Arrest-1</Name></Step>';
                    fs.writeFileSync('./apiproxy/policies/Spike-Arrest-1.xml', pd.xml(spikeArrest.data));
                }


            }

            if (data.Quota === 'yes') {
                if (requestXml.indexOf('<Name>Quota-1</Name>') === -1) {
                    insertOptions = insertOptions + '<Step><Name>Quota-1</Name></Step>';
                    fs.writeFileSync('./apiproxy/policies/Quota-1.xml', pd.xml(quota.data));
                }


            }

            if (data.Cache === 'yes') {
                if (requestXml.indexOf('<Name>Response-Cache-1</Name>') === -1) {
                    if ((requestXmlForResponsePost.indexOf('<Name>Response-Cache-1</Name>') === -1)) {
                        insertOptions = insertOptions + '<Step><Name>Response-Cache-1</Name></Step>';
                        insertOptionsForResponse = insertOptionsForResponse + '<Step><Name>Response-Cache-1</Name></Step>';
                        fs.writeFileSync('./apiproxy/policies/Response-Cache-1.xml', pd.xml(responseCache.data));
                    }
                }


            }
            if (data.ConcurrentRateLimit === 'yes') {
                if (requestXmlForResponsePre.indexOf('<Name>Concurrent-Rate-Limit-1</Name>') === -1) {
                   /* if ((requestXmlForResponsePost.indexOf('<Name>Concurrent-Rate-Limit-1</Name>') === -1)) { 
                        if ((requestXmlForFaultRule.indexOf('<Name>Concurrent-Rate-Limit-1</Name>') === -1 )){*/
                         insertOptionsForFaultRule =  insertOptionsForFaultRule + '<Step><Name>Concurrent-Rate-Limit-1</Name></Step>';
                        //}
                        insertOptionsForResponse = insertOptionsForResponse + '<Step><Name>Concurrent-Rate-Limit-1</Name></Step>';
                        insertOptionsForResponsePre = insertOptionsForResponsePre + '<Step><Name>Concurrent-Rate-Limit-1</Name></Step>';
                        fs.writeFileSync('./apiproxy/policies/Concurrent-Rate-Limit-1.xml', pd.xml(concurrentRateLimit.data));
                        
                    //}
                    /*Just attach the default fault rule, as it is..*/
                } else {
                    var nodesForDefaultFaultRule = xpath.select("//TargetEndpoint//DefaultFaultRule//Step", docResponse);
                    requestXmlForFaultRule = nodesForDefaultFaultRule[0].toString();
                    console.log('***' +  requestXmlForFaultRule);



                }


            }
            /* These statements make sure that when we run it for second time, same things dont get added*/
            if (requestXml.indexOf("<Request/>") !== -1) {
                requestXml = '<Request>' + insertOptions + '</Request>';
            } else {
                requestXml = requestXml.slice(0, 9) + insertOptions + requestXml.slice(9);
            }

            if (requestXmlForResponsePost.indexOf("<Response/>") !== -1) {
                requestXmlForResponsePost = '<Response>' + insertOptionsForResponse + '</Response>';
               // console.log("*****" + requestXmlForResponsePost);
            } else {
                requestXmlForResponsePost = requestXmlForResponsePost.slice(0, 10) + insertOptionsForResponse + requestXmlForResponsePost.slice(10);
                // console.log(requestXmlForResponse);
            }
//*******************************************************************************************************

           if (data.ConcurrentRateLimit === 'yes') { /*if cache = yes, dont apply it in pre flow*/
                if (requestXmlForResponsePre.indexOf("<Request/>") !== -1) {

                    requestXmlForResponsePre = '<Request>' + insertOptionsForResponsePre + '</Request>';
                  
                   // console.log("*****" + requestXmlForResponsePre);
                } else {

                    requestXmlForResponsePre = requestXmlForResponsePre.slice(0, 10) + insertOptionsForResponsePre + requestXmlForResponsePre.slice(10);

                    // console.log(requestXmlForResponse);
                }
                /*if (requestXmlForFaultRule.indexOf("<DefaultFaultRule>") !== -1) {
                    
                      requestXmlForFaultRule =  insertOptionsForFaultRule ;
                     console.log("*****requestXmlForFaultRule" + requestXmlForFaultRule);
                  } else {
                      requestXmlForFaultRule = requestXmlForFaultRule.slice(0, 31) + insertOptionsForFaultRule + requestXmlForFaultRule.slice(31);
                      console.log("reqeustXml in Else " +requestXmlForFaultRule);
                      console.log("reqeustXml in Else " +insertOptionsForFaultRule);
                  }*/
                  if (requestXmlForFaultRule.indexOf("<DefaultFaultRule>") === -1) {
                    requestXmlForFaultRule = requestXmlForFaultRule.slice(0, 31) + insertOptionsForFaultRule + requestXmlForFaultRule.slice(31);

                  }

            }
            //console.log("*****beforeIF" + requestXmlForFaultRule);
           // console.log("*****insertOptions" + insertOptionsForFaultRule);
           

            return new Promise((resolve, reject) => {
                fs.writeFileSync('./apiproxy/proxies/default.xml', pd.xml('<?xml version="1.0" encoding="UTF-8" standalone="yes"?> <ProxyEndpoint name="default"><Description/><FaultRules/><PreFlow name="PreFlow">' + requestXml + '<Response/></PreFlow><PostFlow name="PostFlow"><Request/><Response/></PostFlow><Flows/><HTTPProxyConnection><BasePath>' + data.Alias + '</BasePath><Properties/><VirtualHost>default</VirtualHost><VirtualHost>secure</VirtualHost></HTTPProxyConnection><RouteRule name="default"><TargetEndpoint>default</TargetEndpoint></RouteRule></ProxyEndpoint>'));
                resolve();
            }).then(() => {
                fs.writeFileSync('./apiproxy/targets/default.xml', pd.xml('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><TargetEndpoint name="default"> <Description/> <DefaultFaultRule name="DefaultFaultRule">' + requestXmlForFaultRule + '<AlwaysEnforce>true</AlwaysEnforce></DefaultFaultRule><FaultRules/> <Flows/><PreFlow name="PreFlow"> ' + requestXmlForResponsePre + ' <Response/></PreFlow><PostFlow name="PostFlow"> <Request/> ' + requestXmlForResponsePost + ' </PostFlow><HTTPTargetConnection><Properties/> <URL>' + data.Url + '</URL></HTTPTargetConnection> </TargetEndpoint>'));
                resolve();
            })
            resolve();

        })


    }
}


