//RUN PACKAGES
const express = require('express')
const path = require('path')
const multer = require('multer');
const bodyParser = require('body-parser');
var fs = require('fs');


//SETUP APP
const app = express()
const port = 3000
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

app.use(express.static('public'))

//MULTER  CONFIG (NEED TO PASS TO ANOTHER JS SO IT DOESN'T CLUTTER EVERYTHING)
  const multerConfig = {

    //specify diskStorage (another option is memory)
    storage: multer.diskStorage({

      //specify destination
      destination: function(req, file, next){
        next(null, './public/photo-storage');
      },

      //specify the filename to be unique
      filename: function(req, file, next){
        console.log(file);
        //get the file mimetype ie 'image/jpeg' split and prefer the second value ie'jpeg'
        const ext = file.mimetype.split('/')[1];
        //set the file fieldname to a unique name containing the original name, current datetime and the extension.
        next(null, file.fieldname + '-' + Date.now() + '.stl');
      }
    }),

    // filter out and prevent non-image files.
    fileFilter: function(req, file, next){
          if(!file){
            next();
          }

        // only permit image mimetypes
        const image = file.mimetype.startsWith('application/octet-stream');
        if(image){
          console.log('stl file uploaded');
          next(null, true);
        }else{
          console.log("not an stl");
          console.log(file.mimetype);
          //TODO:  A better message response to user on failure.
          return next();
        }
    }
  };


   app.post('/upload', multer(multerConfig).single('photo'),function(req, res){
      //Here is where I could add functions to then get the url of the new photo
      //And relocate that to a cloud storage solution with a callback containing its new url
      //then ideally loading that into your database solution.   Use case - user uploading an avatar...
      res.send('Complete! Check out your public/photo-storage folder.  Please note that files not encoded with an image mimetype are rejected. <a href="/">try again</a>');
      //Order sent message.
  });


app.get('/', function(req, res) {
    //res.sendFile(path.join(__dirname + '/index.html'));
    res.sendFile(path.join(__dirname + '/glbconvert.html'));
    res.sendFile(path.join(__dirname + '/public/photo-1548706588944.stl'));
    console.log("mando esto");
    //res.sendFile(path.join(__dirname + '/bebeco.html'));
});

// SERVE ORDER DATA:

//1. toma el archivo
//2. convierte utilizando convertermod.js
//3. serve it in aframe
/*
fs.readFile('public/photo-1548706588944.stl', 'utf8', function(err, contents) {
    console.log(contents);

});
console.log("hello");
*/
// PUT order in

/* GET ORDER:
app.get('/order',function(order no.)){
  1. Convierte el archivo en una carpeta temporal.
  2. Lo carga junto con el html.

  3. Puede ver dos ordenes con datos diferentes.

}


*/


app.listen(port, () => console.log(`Example app listening on port ${port}!`))
