var pd = require('pretty-data').pd;
var fs=require('fs');
var apiKeySecurity = require('./apikeySecurity.js');
module.exports = {

    applyTrafficPolicies: function(data) {
        var requestXml = '<Request></Request>';
        
         var insertOptions = '';
        
        return new Promise((resolve, reject) => {
            if (data.APIKeySecurity === 'yes') {
                insertOptions =  '<Step><Name>Verify-API-Key-1</Name></Step>';
                fs.writeFileSync('./apiproxy/policies/Verify-API-Key-1.xml', pd.xml(apiKeySecurity.data));
                
                
            } 
            requestXml = requestXml.slice(0,9) + insertOptions + requestXml.slice(9);
            console.log(requestXml);
            fs.writeFileSync('./apiproxy/proxies/default.xml',pd.xml('<?xml version="1.0" encoding="UTF-8" standalone="yes"?> <ProxyEndpoint name="default"><Description/><FaultRules/><PreFlow name="PreFlow">'+ requestXml + '<Response/></PreFlow><PostFlow name="PostFlow"><Request/><Response/></PostFlow><Flows/><HTTPProxyConnection><BasePath>'+data.Alias+'</BasePath><Properties/><VirtualHost>default</VirtualHost><VirtualHost>secure</VirtualHost></HTTPProxyConnection><RouteRule name="default"><TargetEndpoint>default</TargetEndpoint></RouteRule></ProxyEndpoint>'));
            resolve();
        })
       

}
}

        
       