var pd = require('pretty-data').pd;
var fs=require('fs');
var apiKeySecurity = require('./apikeySecurity.js');
var xpath = require('xpath')
, dom = require('xmldom').DOMParser;
var jsonThreat=require('./JsonThreat.js');
var accessTokenOAuth = require('./verifyAccessTokenForOauth.js')
module.exports = {

    applySecurityPolicies: function(data) {
        var requestXml = fs.readFileSync('./apiproxy/proxies/default.xml','utf-8');
        //console.log(requestXml);
        var doc = new dom().parseFromString(requestXml);
        var nodes = xpath.select("//ProxyEndpoint//PreFlow//Request", doc);
        requestXml = nodes[0].toString();
        console.log('***'+requestXml);
         var insertOptions = '';
        
        return new Promise((resolve, reject) => {
            if (data.JSONThreatProtection  === 'yes') {
                if(requestXml.indexOf('<Name>JSON-Threat-Protection-1</Name>') === -1) {
                insertOptions =  '<Step><Name>JSON-Threat-Protection-1</Name></Step>';
                fs.writeFileSync('./apiproxy/policies/JSON-Threat-Protection-1.xml', pd.xml(jsonThreat.data));
                }
                
                
            } 
            if (data.APIKeySecurity === 'yes') {
                if(requestXml.indexOf('<Name>Verify-API-Key-1</Name>') === -1) {
                insertOptions =  insertOptions + '<Step><Name>Verify-API-Key-1</Name></Step>';
                fs.writeFileSync('./apiproxy/policies/Verify-API-Key-1.xml', pd.xml(apiKeySecurity.data));
                }
            } 

            if (data.OAuthSecurity === 'yes') {
                if(requestXml.indexOf('<Name>OAuth-v20-1</Name>') === -1) {
                insertOptions =  insertOptions + '<Step><Name>OAuth-v20-1</Name></Step>';
                fs.writeFileSync('./apiproxy/policies/OAuth-v20-1.xml', pd.xml(accessTokenOAuth.data));
                }
            }


            if (requestXml.indexOf("<Request/>") !== -1) {
            requestXml = '<Request>' + insertOptions + '</Request>';
            } else {
                requestXml = requestXml.slice(0,9) + insertOptions + requestXml.slice(9);
            }
            console.log(requestXml);
            fs.writeFileSync('./apiproxy/proxies/default.xml',pd.xml('<?xml version="1.0" encoding="UTF-8" standalone="yes"?> <ProxyEndpoint name="default"><Description/><FaultRules/><PreFlow name="PreFlow">'+ requestXml + '<Response/></PreFlow><PostFlow name="PostFlow"><Request/><Response/></PostFlow><Flows/><HTTPProxyConnection><BasePath>'+data.Alias+'</BasePath><Properties/><VirtualHost>default</VirtualHost><VirtualHost>secure</VirtualHost></HTTPProxyConnection><RouteRule name="default"><TargetEndpoint>default</TargetEndpoint></RouteRule></ProxyEndpoint>'));
            resolve();
        })
       

}
}

        
       