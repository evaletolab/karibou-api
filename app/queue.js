module.exports = function(p, c) {
  var slice = [].slice;
  var bus=require('./bus');

  function noop(){}

  var callback=function(q, i, originalCallback) {
    return function(e, r) {
      --q.active;
      if (!q.continueOnError&&q.error != null) return;
      if (!q.continueOnError && e != null) {
        q.error = e; // ignore new tasks and squelch active callbacks
        q.started = q.remaining = NaN; // stop queued tasks from starting
        q.notify();
      } else {
        // original callback 
        originalCallback&&originalCallback(e,r);
        q.tasks[i] = r;
        if (--q.remaining) q.popping || q.pop();
        else q.notify();
      }
    };
  }

  //
  //
  var Queue= function (parallelism, continueOnError) {
        this.q;
        this.tasks = [];
        this.started = 0; // number of tasks that have been started (and perhaps finished)
        this.active = 0; // number of tasks currently being executed (started but not finished)
        this.remaining = 0; // number of tasks not yet finished
        this.popping; // inside a synchronous task callback?
        this.error = null;
        this.await = noop;
        this.parallelism=parallelism||1;
        this.continueOnError=continueOnError||true;

        this.all;

        // if (!this.parallelism) this.parallelism = Infinity;
  }


  Queue.prototype.pop=function() {
    while (this.popping = this.started < this.tasks.length && this.active < this.parallelism) {
      var i = this.started++,
          t = this.tasks[i],
          a = slice.call(t, 1),
          lst=a[a.length-1];

      //
      // if callback exist, proxying it
      if(this.continueOnError && typeof lst ==='function'){
        a[a.length-1]=callback(this, i,lst)
      //
      // if last arg is a responce 
      }else if(lst["req"] && lst["connection"]){
        lst.on("finish",callback(this,i))
      }else a.push(callback(this,i));

      ++this.active;
      t[0].apply(null, a);
      
    }
  }  

  Queue.prototype.notify=function() {
    var me=this;
    setTimeout(function(){      
    if (me.error != null) me.await(me.error);
    else if (me.all) me.await(me.error, me.tasks);
    else me.await.apply(null, [me.error].concat(me.tasks));
    },0)
  }  


  /**
   */
  Queue.prototype.defer=function() {
    if (!this.error) {
      this.tasks.push(arguments);
      ++this.remaining;
      this.pop();
    }
    return this.q;
  }
  Queue.prototype.await=function(f) {
    this.await = f;
    this.all = false;
    if (!this.remaining) this.notify();
    return this.q;
  }
  Queue.prototype.awaitAll=function(f) {
    this.await = f;
    this.all = true;
    if (!this.remaining) this.notify();
    return this.q;
  }
  Queue.prototype.empty=function(f) {

    this.await = f;
    this.all = true;
    return this.q;
  }

  return new Queue(p,c)
}


