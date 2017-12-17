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
var create = require('./createFilesforNewProxies');
var trafficPolicies=require('./policiesForTrafficManagement');
var logging =require('./applyLoggingPolicy.js');
var productAndDevApp = require('./createProductAndDevApp');
/*Read the excel sheet*/
var workbook = XLSX.readFile('Traffic.xlsx');
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
    var requestXmlForResponse = '';
    var insertOptionsForResponse = '';

    uploader(0);
 
/*run a recursive function for each target url*/
function uploader(i) {
    if(i < data.length) {
 
  opts['api'] = data[i].Name;
 
  sdk.listDeployments(opts).then((result)=> {
      console.log(result);
      if(result.deployments[0].revision >= 1) {
          opts['revision'] = result.deployments[0].revision;
          sdk.fetchProxy(opts).then((result) => {
              
            extract('./'+ data[i].Name +'.zip', {dir: '/home/oem/Documents/Raunak' +data[i].Name}, function (err) {
                // extraction is complete. make sure to handle the err
               fsExtra.copySync('/home/oem/Documents/Raunak' +data[i].Name+'/apiproxy','./apiproxy');
                delete opts['revision'];
                delete opts['api'];
                trafficPolicies.applyTrafficPolicies(data[i]).then(()=> {
                    /*Start deploying proxy in EDGE*/
                    opts.api = data[i].Name;
                    console.log('Deploying ' + data[i].Name +' ....');
                    logging.applyLoggingPolicy(data[i]).then(()=> {
                    deployProxy.deploy(opts).then((err)=> {
                      
                        console.log('Deployed ' + data[i].Name);
                        uploader(i+1);
                    })
                })
                })
               })
          
          })
      }  
      
  }).catch((err) => { /*If there are no proxies deployed, it will start creating new proxies*/
    
    
    if(String(err).indexOf('HTTP error 404') !== -1) { /*If error comes 404, that means proxy is not deployed*/
    create.createFiles(data[i])
    .then(()=> {
      trafficPolicies.applyTrafficPolicies(data[i]).then(()=> {
          /*Start deploying proxy in EDGE*/
          opts.api = data[i].Name;
          console.log('Deploying ' + data[i].Name +' ....');
          logging.applyLoggingPolicy(data[i]).then(()=> {
          deployProxy.deploy(opts).then((err)=> {
            
              console.log('Deployed ' + data[i].Name);
              uploader(i+1);
          })
        })
      })

    })
} else { /*Else print the error*/
    console.log(err);
}

  })
 
     
      if(data.length === 1) {
       stringOfProxies= data[i].Name
      } else {
          stringOfProxies = stringOfProxies + ',' + data[i].Name;
      }
      
      


  } else {
     
    productAndDevApp.createProductAndApp(opts,stringOfProxies).then(()=> {

        console.log('All proxies deployed');
    })
  
}
  
    
}