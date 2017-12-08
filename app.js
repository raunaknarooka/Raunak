XLSX = require('xlsx');
var fs=require('fs');
var apigeetool = require('apigeetool')
var sdk = apigeetool.getPromiseSDK()
var pd = require('pretty-data').pd;
var fsExtra=require('fs-extra');
var extract = require('extract-zip')

var properties = require('./properties.js');
var apiKeySecurity = require('./apikeySecurity.js');
var quota = require('./quota.js');
var deployProxy = require('./deploy.js');
/*Read the excel sheet*/
var workbook = XLSX.readFile('test.xlsx');
var first_sheet_name = workbook.SheetNames[0];

/* Get worksheet */
var worksheet = workbook.Sheets[first_sheet_name];

var data= XLSX.utils.sheet_to_json(worksheet);

/*Create skeleton apiproxy folder structure*/
var apiproxy='./apiproxy';
if (!fs.existsSync(apiproxy)){
fs.mkdirSync(apiproxy);
}

var dir1 ='./apiproxy/proxies';
var dir2= './apiproxy/targets';
var policy = './apiproxy/policies';
if (!fs.existsSync(dir1)){
fs.mkdirSync(dir1);
}
if (!fs.existsSync(dir2)){
fs.mkdirSync(dir2);
}
if (!fs.existsSync(policy)){
    fs.mkdirSync(policy);
  
}

/*Initialize apigeetool*/

    var opts = {
        organization: properties.organization,
        username: properties.username,
        password: properties.password,
        environments: properties.environments,
        
    }
    var stringOfProxies = "";
    var requestXml = '';
    var insertOptions = '';
   
    uploader(0);
 
/*run a recursive function for each target url*/
function uploader(i) {
  /*Create required proxy files*/
  opts['api'] = data[i].Name;
  sdk.listDeployments(opts).then((result)=> {
      console.log(result);
      if(result.deployments[0].revision >1) {
          opts['revision'] = result.deployments[0].revision;
          sdk.fetchProxy(opts).then((result) => {
              
            extract('./'+ data[i].Name +'.zip', {dir: 'C:/proxyProject/Raunak/'+data[i].Name}, function (err) {
                // extraction is complete. make sure to handle the err
               fsExtra.copySync('C:/proxyProject/Raunak/'+data[i].Name+'/apiproxy','./apiproxy');
                delete opts['revision'];
                delete opts['api'];
               })
          
          })
      }
  })
  if(i < data.length) {
     requestXml = '<Request></Request>';
    
     insertOptions = '';
      if(data.length === 1) {
       stringOfProxies= data[i].Name
      } else {
          stringOfProxies = stringOfProxies + ',' + data[i].Name;
      }
      

      
return new Promise((resolve, reject) => {

    fs.writeFileSync('./apiproxy/'+data[i].Name+'.xml',pd.xml('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><APIProxy name="'+data[i].Name+'"> <Description>'+data[i].Description+'</Description></APIProxy>'));
resolve();
}).then(() => {

return new Promise((resolve, reject) => {
    if (data[i].APIKeySecurity === 'yes') {
        insertOptions =  '<Step><Name>Verify-API-Key-1</Name></Step>';
        fs.writeFileSync('./apiproxy/policies/Verify-API-Key-1.xml', pd.xml(apiKeySecurity.data));
        
        
    }
    if (data[i].TrafficManagement === 'yes') {
        insertOptions = insertOptions + '<Step><Name>Quota-1</Name></Step>';
        fs.writeFileSync('./apiproxy/policies/Quota-1.xml', pd.xml(quota.data));
       
    }
    requestXml = requestXml.slice(0,9) + insertOptions + requestXml.slice(9);
    console.log(requestXml);
    fs.writeFileSync('./apiproxy/proxies/default.xml',pd.xml('<?xml version="1.0" encoding="UTF-8" standalone="yes"?> <ProxyEndpoint name="default"><Description/><FaultRules/><PreFlow name="PreFlow">'+ requestXml + '<Response/></PreFlow><PostFlow name="PostFlow"><Request/><Response/></PostFlow><Flows/><HTTPProxyConnection><BasePath>'+data[i].Alias+'</BasePath><Properties/><VirtualHost>default</VirtualHost><VirtualHost>secure</VirtualHost></HTTPProxyConnection><RouteRule name="default"><TargetEndpoint>default</TargetEndpoint></RouteRule></ProxyEndpoint>'));
resolve();
}).then(() => {

return new Promise((resolve,reject) => {
fs.writeFileSync('./apiproxy/targets/default.xml',pd.xml('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><TargetEndpoint name="default"><Description/><FaultRules/><PreFlow name="PreFlow"><Request/><Response/></PreFlow><PostFlow name="PostFlow"><Request/><Response/></PostFlow><Flows/><HTTPTargetConnection><Properties/><URL>'+data[i].Url+'</URL></HTTPTargetConnection></TargetEndpoint>'));
resolve();
}).then(() => {

/*Start deploying proxy in EDGE*/
opts.api = data[i].Name;
console.log('Deploying ' + data[i].Name +' ....');
deployProxy.deploy(opts).then((err)=> {
    console.log(err);
    console.log('Deployed ' + data[i].Name);
    uploader(i+1);
})
/*sdk.deployProxy(opts)
.then(function(result){
                    //deploy success
/*Delete the files created as the next proxy will require new file*/
//fs.unlinkSync('./apiproxy/'+data[i].Name+'.xml');
//fs.unlinkSync('./apiproxy/proxies/default.xml');
//s.unlinkSync('./apiproxy/targets/default.xml');
//fsExtra.emptyDir('./apiproxy/policies').then(() => {
  //  uploader(i+1);
  //  console.log('Deployed ' + data[i].Name);
//})
//.catch(err => {
//    console.log(err);
 // })
 //})


})
});
});

  }
  console.log('All proxies deployed');
  console.log('Creating a product');
//console.log(set.size);

  return new Promise((resolve,reject) => {
    delete opts["api"];
    opts["productName"] = 'proxyPOC'
    opts["productDesc"] = 'Product for proxy POC'
    opts["proxies"] = stringOfProxies;
   console.log(JSON.stringify(opts));
   sdk.createProduct(opts)
      .then(function(result){
        //product created
        console.log('Product created');
        resolve();
      },function(err){
        //product creation failed
        console.log(err);
      }) ; 
  }).then(()=> {
     console.log('Creating developer app');
    opts.name = appName
    opts.apiProducts = opts.productName
    opts.email = 'pujakhetan5@gmail.com'
  console.log(JSON.stringify(opts));
    sdk.createApp(opts)
    .then(function(result){
      console.log('Developer app created');
    },function(err){
        console.log(err);
    }) ;
  })
  
    
}