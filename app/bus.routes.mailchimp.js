var MailChimpAPI = require('mailchimp').MailChimpAPI;
      
//
// subscribe to mailchimp helper
// content should contains:
//   email,fname,lname,id      
exports.subscribe=function(content,cb) {
  if(!cb)cb=function(err){};
    try { 
        var api = new MailChimpAPI(config.auth.mailchimp.key, { version : '2.0' });
        var merge_vars = {
          EMAIL: content.email,
          FNAME: content.fname,
          LNAME: content.lname
        };

        for (var property in content.tags) {
            if (content.tags.hasOwnProperty(property)) {
                merge_vars[property]=content.tags[property];
            }
        }        
        // thks mailchimp
        api.call('lists', 'subscribe', 
                { id: content.id, 
                  email:{email:content.email},
                  merge_vars:merge_vars,
                  double_optin:false
                }, cb);

    } catch (error) {
      return cb(error)
    }
}      
