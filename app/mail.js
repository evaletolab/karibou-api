module.exports = function(app,bus) {
  var path           = require('path')
    , templatesDir   = path.resolve(__dirname, '..', 'emails')
    , emailTemplates = require('email-templates')
    , Q              = require('q')
    , nodemailer     = require('nodemailer');


  var provider=config.mail[config.mail.default],
      optsTransport={
        host: provider.host,
        port: provider.port,
        auth: {
          user: provider.user,
          pass: provider.code
        }
      };


  //
  // make transport working without SSL    
  if(config.mail.develMode){
    optsTransport.secure=false;
    optsTransport.ignoreTLS=true;        
  }

  //
  // Prepare nodemailer transport object
  var transport = nodemailer.createTransport(optsTransport);


  //
  // send a single mail
  var sendmail=function(to, subject, content, templateName, cb) {
    emailTemplates(templatesDir, function(err, t) {

      if (err) {
        return cb && cb(err);
      } 

      //
      // testing mode
      content.develMode=false;
      if(config.mail.develMode){
        content.develMode=config.mail.develMode;
        subject="[TEST] "+subject;
      }

      //
      // Send a single email
      t(templateName, content, function(err, html, text) {
        if (err) {
          return cb && cb(err);
        }


        var mail={
          from: config.mail.from,
          to: to,
          subject: subject,
          //_html: html,
          text: text
        };


        //
        // send html format too
        if(content.withHtml){
          mail.html=html;
        }

        //
        // avoid cc in some cases 
        if(!content.noCC && config.mail.cc.indexOf(to)===-1){
          mail.cc=config.mail.cc.join(', ');          
        }
        transport.sendMail(mail, cb);
        if (process.env.NODE_ENV!=='production'){
          console.log('sendmail:to',mail.to)
          console.log('sendmail:cc',mail.cc)
          console.log('sendmail:txt',text)
        }

      });
    });
  }


  //
  // sendmail fuction is removed for testing
  if (process.env.NODE_ENV==='test'){
    sendmail=function(to, subject, content, template, cb){
      var result={ 
        accepted: [ to],
        rejected: [],
        response: '250 2.0.0 Ok: queued as B2E6B4814D8 '+subject,
        envelope: { from: 'james@karibou.ch', to: [to] },
        messageId: '1445330063674-23cd03de-de15caac-b431a2ba@karibou.ch' 
      };
      setTimeout(function() {}, parseInt(Math.random()*10));
      cb&&cb(null,result);
    }
  }
  
  bus.on('sendmail',function(to, subject, content, template, cb){
    var deferred = Q.defer();

    sendmail(to, subject, content, template, function (err,result) {
      if(err){
        if(cb){return cb(err);}
        return deferred.reject(err);
      }
      if(cb){
        return cb(0,result)
      }
      deferred.resolve(result);
    });
    //
    // flexible use of cb or promise
    return  deferred.promise;
  });


}
