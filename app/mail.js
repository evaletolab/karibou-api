module.exports = function(app) {
  var path           = require('path')
    , templatesDir   = path.resolve(__dirname, '..', 'emails')
    , emailTemplates = require('email-templates')
    , nodemailer     = require('nodemailer');


  var provider=config.mail[config.mail.default];

  //
  // Prepare nodemailer transport object
  var transport = nodemailer.createTransport("SMTP", {
    //service: config.mail.default,
    host: provider.host,
    port: provider.port,
    auth: {
      user: provider.user,
      pass: provider.code
    }
  });

  //
  // send a single mail 
  var sendmail=function(to, subject, content, template, cb) {
    emailTemplates(templatesDir, function(err, t) {

      if (err) {
        return cb(err);
      } else {


        // Send a single email
        t(template, content, function(err, html, text) {
          if (err) {
            return cb(err);
          } else {
            transport.sendMail({
              from: config.mail.from,
              to: to,
              cc: config.mail.to,
              subject: subject,
              _html: html,
              // generateTextFromHTML: true,
              text: text
            }, cb);
          }
        });
      }
    });
  }

  if (process.env.NODE_ENV==='test'){
    sendmail=function(to, subject, content, template, cb){
      cb(null,"test is running")
    }
  }

  app.configure(function() {
    app.use(function(req, res, next){
        req.sendmail=sendmail;
      next();
    });
  });
}
