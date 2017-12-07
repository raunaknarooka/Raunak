XLSX = require('xlsx');

var fs=require('fs');

var apigeetool = require('apigeetool')

var sdk = apigeetool.getPromiseSDK()

var pd = require('pretty-data').pd;

var properties = require('./properties.js');

var async=require('async-series');



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



if (!fs.existsSync(dir1)){

fs.mkdirSync(dir1);

}

if (!fs.existsSync(dir2)){

fs.mkdirSync(dir2);

}



/*Initialize apigeetool*/



var opts = {

organization: properties.organization,

username: properties.username,

password: properties.password,

environments: properties.environments


}

uploader(0);


/*run a recursive function for each target url*/

function uploader(i) {

/*Create required proxy files*/

if(i < data.length) {

return new Promise((resolve, reject) => {



fs.writeFileSync('./apiproxy/'+data[i].Name+'.xml',pd.xml('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><APIProxy name="'+data[i].Name+'"> <Description>'+data[i].Description+'</Description></APIProxy>'));

resolve();

}).then(() => {



return new Promise((resolve, reject) => {

fs.writeFileSync('./apiproxy/proxies/default.xml',pd.xml('<?xml version="1.0" encoding="UTF-8" standalone="yes"?> <ProxyEndpoint name="default"><Description/><FaultRules/><PreFlow name="PreFlow"><Request/><Response/></PreFlow><PostFlow name="PostFlow"><Request/><Response/></PostFlow><Flows/><HTTPProxyConnection><BasePath>'+data[i].Alias+'</BasePath><Properties/><VirtualHost>default</VirtualHost><VirtualHost>secure</VirtualHost></HTTPProxyConnection><RouteRule name="default"><TargetEndpoint>default</TargetEndpoint></RouteRule></ProxyEndpoint>'));

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

console.log('Deployed... ' + data[i].Name);

return new Promise((resolve, reject) => {

fs.mkdirSync('./'+data[i].Name);


resolve();

}).then(() => {

return new Promise((resolve, reject) => {

fs.copyFileSync('./apiproxy/'+data[i].Name+'.xml','./'+data[i].Name+'/');


fs.mkdirSync('./'+data[i].Name+'/proxies');

resolve();

}).then(() => {

return new Promise((resolve, reject) => {

fs.copyFileSync('./apiproxy/proxies/default.xml','./'+data[i].Name+'/proxies');

fs.mkdirSync('/'+data[i].Name+'/targets');

resolve();

}).then(()=> {

return new Promise((resolve, reject) => {

fs.copyFileSync('./apiproxy/targets/default.xml','./'+data[i].Name+'/targets');

resolve();

}).then(() => {

return new Promise((resolve, reject) => {

fs.unlinkSync('/apiproxy/'+data[i].Name+'.xml');

fs.unlinkSync('./apiproxy/proxies/default.xml');

fs.unlinkSync('./apiproxy/targets/default.xml');

setTimeout(uploader(i+1),7000);


})



})



})

})

})





},function(err){

//deploy failed

console.log(err);

})


})

});



})

}

}



