
var apigeetool = require('apigeetool')
var sdk = apigeetool.getPromiseSDK()
var fsExtra=require('fs-extra');
var fs=require('fs');
module.exports = {
    deploy: function (opts) {
      console.log(opts);
        return new Promise((resolve, reject)=> {
            
            sdk.deployProxy(opts)
            .then(function(result){
                                //deploy success
            /*Delete the files created as the next proxy will require new file*/
        
            fs.unlinkSync('./apiproxy/'+opts['api']+'.xml');
            fs.unlinkSync('./apiproxy/proxies/default.xml');
            fs.unlinkSync('./apiproxy/targets/default.xml');
            fsExtra.emptyDir('./apiproxy/policies').then(() => {
                
                console.log('Deployed ' + opts['api']);
                return resolve();
               
            })
          
        },function(err){
            //deploy failed, error message printed
console.log(err);
})
       

        })
        
  }
};
  