/**
 * https://github.com/ncb000gt/node-cron
 */
module.exports =function(bus) {
  var CronJob=new require('cron').CronJob,
      jobs=[],
      Q=require('q');


  if(config.cron&&config.cron.length){
    config.cron.forEach(function(cron) {
      var job=new CronJob(cron.time, function() {
        bus.emit(cron.task,cron);
      }, null, true, config.timezone);  

      console.log('DEBUG cronjob: install task',cron)
      jobs.push(job);

    });

  }

}

