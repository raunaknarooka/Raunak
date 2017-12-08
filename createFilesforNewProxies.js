var pd = require('pretty-data').pd;
var fs=require('fs');
module.exports = {

    createFiles: function(data) {
        requestXml = '<Request></Request>';
        return new Promise((resolve, reject) => {
            
              fs.writeFileSync('./apiproxy/'+data.Name+'.xml',pd.xml('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><APIProxy name="'+data.Name+'"> <Description>'+data.Description+'</Description></APIProxy>'));
            resolve();
            }).then(() => {
            
            return new Promise((resolve, reject) => {
              fs.writeFileSync('./apiproxy/proxies/default.xml',pd.xml('<?xml version="1.0" encoding="UTF-8" standalone="yes"?> <ProxyEndpoint name="default"><Description/><FaultRules/><PreFlow name="PreFlow">'+ requestXml + '<Response/></PreFlow><PostFlow name="PostFlow"><Request/><Response/></PostFlow><Flows/><HTTPProxyConnection><BasePath>'+data.Alias+'</BasePath><Properties/><VirtualHost>default</VirtualHost><VirtualHost>secure</VirtualHost></HTTPProxyConnection><RouteRule name="default"><TargetEndpoint>default</TargetEndpoint></RouteRule></ProxyEndpoint>'));
            resolve();
            }).then(() => {
            
            return new Promise((resolve,reject) => {
            fs.writeFileSync('./apiproxy/targets/default.xml',pd.xml('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><TargetEndpoint name="default"><Description/><FaultRules/><PreFlow name="PreFlow"><Request/><Response/></PreFlow><PostFlow name="PostFlow"><Request/><Response/></PostFlow><Flows/><HTTPTargetConnection><Properties/><URL>'+data.Url+'</URL></HTTPTargetConnection></TargetEndpoint>'));
            resolve();
            })
        })

    })

}
}

        
       