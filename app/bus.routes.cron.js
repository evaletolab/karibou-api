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
        console.log("DEBUG crontask",cron.time,cron.task);
        bus.emit(cron.task,cron);
      }, null, true, config.timezone);  

      console.log('DEBUG cronjob: install task',cron.time,cron.task)
      jobs.push(job);

    });

  }

}

