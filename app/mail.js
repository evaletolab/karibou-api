module.exports = function(app,bus) {
  var path           = require('path')
    , templatesDir   = path.resolve(__dirname, '..', 'emails')
    , emailTemplates = require('email-templates')
    , nodemailer     = require('nodemailer');


  var provider=config.mail[config.mail.default];

  //
  // Prepare nodemailer transport object
  var transport = nodemailer.createTransport({
    //service: config.mail.default,
    host: provider.host,
    port: provider.port,
    auth: {
      user: provider.user,
      pass: provider.code
    }
  });

  //
  // Custom function for sending emails outside the loop
  var Render = function(locals, options, cb) {
    this.locals = locals;
    this.send = function(err, html, text) {
      if (err) {
        return cb && cb(err);
      }
      var mail={
        from: config.mail.from,
        to: locals.email,
        subject: subject,
        //_html: html,
        // generateTextFromHTML: true,
        text: text
      };
      //
      // send html format too
      if(options.withHtml){
        mail.html=html;
      }
      //
      // avoid cc in some cases 
      if(!options.noCC && config.mail.cc.indexOf(locals.email)===-1){
        mail.cc=config.mail.cc.join(', ');          
      }
      transport.sendMail(mail, cb);
    };
    this.batch = function(batch) {
      batch(this.locals, templatesDir, this.send);
    };
  };

  //
  // send a multiples mail
  // content[] format:
  //    content.email
  //    content.model
  var batchmail=function(content, subject, options, templateName, cb) {
    emailTemplates(templatesDir, function(err, t) {
      if (err) {
        return cb && cb(err);
      } 
      var errs=[];

      //
      // testing mode
      if(config.mail.develMode){
        subject="[TEST] "+subject;
      }

      //
      // Load the template and send the emails
      t(templateName, true, function(err, batch) {
        for(var user in content) {
          //
          // testing mode
          content[user].develMode=false;
          if(config.mail.develMode){
            content[user].develMode=config.mail.develMode;
          }

          var render = new Render(content[user],{},function(err){
            if(err){errs.push(err)}
            //TODO log activities
          });
          render.batch(batch);
        }
      });

    });
  }

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
          console.log('sendmail',text)
        }

      });
    });
  }



  if (process.env.NODE_ENV==='test'){
    sendmail=function(to, subject, content, template, cb){
      cb&&cb(null,"test is running well")
    }
  }

  bus.on('sendmail',function(to, subject, content, template, cb){
    //console.log("---------------------------EMAIL:",to,subject)
    sendmail(to, subject, content, template, cb);
  });


  return sendmail;
}
