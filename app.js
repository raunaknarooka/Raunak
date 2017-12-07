XLSX = require('xlsx');
var fs=require('fs');
var apigeetool = require('apigeetool')
var sdk = apigeetool.getPromiseSDK()
var pd = require('pretty-data').pd;
var fsExtra=require('fs-extra');

var properties = require('./properties.js');
var apiKeySecurity = require('./apikeySecurity.js');
var quota = require('./quota.js');
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
    var stringOfProxies ;
    var requestXml = '';
    var insertOptions = '';
    var productSet = new Set();
    var proxyCollection = [];
    uploader(0);
 
/*run a recursive function for each target url*/
function uploader(i) {
  /*Create required proxy files*/
  if(i === data.length) {
    proxyCollection.push(stringOfProxies);
  }
  if(i < data.length) {
      return new Promise((resolve, reject) => {

     
     var oldSize = Number(productSet.size);
     productSet.add(data[i].Product);
     console.log(productSet);
     var newSize = Number(productSet.size);
     if(newSize-oldSize === 1)  {
        proxyCollection.push(stringOfProxies);
         console.log(proxyCollection);
         stringOfProxies = '';

     } 
     
     requestXml = '<Request></Request>';
     
     insertOptions = '';
      if(data.length === 1) {
       stringOfProxies= data[i].Name
       resolve();
      } else {
          stringOfProxies = stringOfProxies + ',' + data[i].Name;
          resolve();
        
      }
    }).then(() => {

  
      
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
sdk.deployProxy(opts)
.then(function(result){
                    //deploy success
/*Delete the files created as the next proxy will require new file*/
fs.unlinkSync('./apiproxy/'+data[i].Name+'.xml');
fs.unlinkSync('./apiproxy/proxies/default.xml');
fs.unlinkSync('./apiproxy/targets/default.xml');
fsExtra.emptyDir('./apiproxy/policies').then(() => {
    uploader(i+1);
    console.log('Deployed ' + data[i].Name);
})
.catch(err => {
    console.log(err);
  })
 },function(err){
                    //deploy failed
console.log(err);
 });


})
});
});
});
  }

  console.log('All proxies deployed');
  console.log('************Creating products***************');
  var arrayofProducts = Array.from(productSet);
  console.log(proxyCollection);
  createProducts(0);

  /*run a recursive function to create products and developer apps*/

  function createProducts(i) {


  if(i < arrayofProducts.length) {
  return new Promise((resolve,reject) => {
    delete opts["api"];
    opts["productName"] = arrayofProducts[i]
    opts["productDesc"] = arrayofProducts[i]
    opts["proxies"] = proxyCollection[i+1];
   console.log(JSON.stringify(opts));
   sdk.createProduct(opts)
      .then(function(result){
        //product created
        console.log('****************Product created ' + arrayofProducts[i]+ ' ************');
        resolve();
      },function(err){
        //product creation failed
        console.log(err);
      }) ; 
  }).then(()=> {
     console.log('****************Creating developer app****************');
    opts.name = 'Developer app for ' + arrayofProducts[i]
    opts.apiProducts = arrayofProducts[i]
    opts.email = 'raunak.narooka@lntinfotech.com'
  console.log(JSON.stringify(opts));
    sdk.createApp(opts)
    .then(function(result){
      console.log('***************Developer app created for  ' + arrayofProducts[i] + ' ***********' );
      createProducts(i+1);
    },function(err){
        console.log(err);
    }) ;
  })
}
}
}
    

