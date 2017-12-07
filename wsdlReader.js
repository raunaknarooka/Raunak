var parseString = require('xml2js').parseString;
var fs=require('fs');
XLSX = require('xlsx');
var excelWriter = require('xlsx-writestream');


const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});


var excelData = {};
var opts= { out: 'test.xlsx'};

/*Read the excel file*/
var workbook = XLSX.readFile('test.xlsx');
var first_sheet_name = workbook.SheetNames[0];

/* Get worksheet */
var worksheet = workbook.Sheets[first_sheet_name];


rl.question('What is the folder path of the wsdl files? ', (answer) => {

  console.log('Entered Path is ' + answer);

  rl.close();
  fs.readdir(answer, (err, files) => {
      
      files.forEach((files)=> {
          console.log('***' + files);
        fs.readFile(answer +'/' +files, function (err, data) {
            parseString(data, function (err, result) {
                /*excelData.push({'Url': result['wsdl:definitions']['wsdl:service'][0]['wsdl:port'][0]['soap:address'][0]['$']['location']
            ,'Name': files.split('.')[0] , 'Alias': '/api/v1/'+ files.split('.')[0], 'Description' : files.split('.')[0] + ' proxy'});*/
         
            excelData= {'Url': result['wsdl:definitions']['wsdl:service'][0]['wsdl:port'][0]['soap:address'][0]['$']['location']
            ,'Name': files.split('.')[0] , 'Alias': '/api/v1/'+ files.split('.')[0], 'Description' : files.split('.')[0] + ' proxy'};
            console.log(excelData);
            
             excelWriter.write('./test.xlsx',excelData, function(options, err) {
                console.log(err);
             });
            //console.log(a);
           
               
            });
        })

      })
    

  }) /*fs.readdir closes here*/
  

});



