var parseString = require('xml2js').parseString;
var fs=require('fs');
XLSX = require('xlsx');
var excelWriter = require('xlsx-writestream');
var create = require('./createFilesforNewProxies');
var logging =require('./applyLoggingPolicy.js');
var deployProxy = require('./deploy.js');
var properties = require('./properties.js');


const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});


var excelData = {};
//var opts= { out: 'test.xlsx'};

/*Read the excel file*/
//var workbook = XLSX.readFile('test.xlsx');
//var first_sheet_name = workbook.SheetNames[0];

/* Get worksheet */
//var worksheet = workbook.Sheets[first_sheet_name];
var opts = {
    organization: properties.organization,
    username: properties.username,
    password: properties.password,
    environments: properties.environments,
    
}
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
rl.question('What is the folder path of the wsdl files? ', (answer) => {

  console.log('Entered Path is ' + answer);

  rl.close();
 
  fs.readdir(answer, (err, files) => {
      
    
     
      uploader(answer,files,0);
          
        

  }) /*fs.readdir closes here*/
  

});

function uploader(answer,files,i)
{
   if(i<files.length) {
    fs.readFile(answer +'/' +files[i], function (err, data) {
    parseString(data, function (err, result) {
        

 
    excelData= {'Url': result['wsdl:definitions']['wsdl:service'][0]['wsdl:port'][0]['soap:address'][0]['$']['location']
    ,'Name': files[i].split('.')[0] , 'Alias': '/api/v1/'+ files[i].split('.')[0], 'Description' : files[i].split('.')[0] + ' proxy'};
    //resolve();
    //creating and deploying proxy
        
    var newData = excelData;
    opts['api'] = newData.Name;
     create.createFiles(newData)
    .then(()=> {
        logging.applyLoggingPolicy(data).then(()=> {
        deployProxy.deploy(opts).then(()=> {
            uploader(answer,files,i+1);
            
        })        
        })                     
    })

    })
         
    


    })
}
  
    

}



