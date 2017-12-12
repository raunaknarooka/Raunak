

var apigeetool = require('apigeetool')
var sdk = apigeetool.getPromiseSDK()
var properties = require('./properties.js');


module.exports = {

  //console.log('All proxies deployed');
  //console.log('Creating a product');
//console.log(set.size);
createProductAndApp: function (opts, stringOfProxies ) {
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
    opts.name = 'proxyApp'
    opts.apiProducts = opts.productName
    opts.email = 'raunak.narooka@lntinfotech.com'
  console.log(JSON.stringify(opts));
    sdk.createApp(opts)
    .then(function(result){
      console.log('Developer app created');
    },function(err){
        console.log(err);
    });
  })
    }
}

  
