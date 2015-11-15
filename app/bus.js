/**
 *    Copyright (C) 2015 Karibou Marketplace, Olivier Evalet
 *
 *    This program is free software: you can redistribute it and/or  modify
 *    it under the terms of the GNU Affero General Public License, version 3,
 *    as published by the Free Software Foundation.
 *
 *    This program is distributed in the hope that it will be useful,
 *    but WITHOUT ANY WARRANTY; without even the implied warranty of
 *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *    GNU Affero General Public License for more details.
 *
 *    You should have received a copy of the GNU Affero General Public License
 *    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 *    As a special exception, the copyright holders give permission to link the
 *    code of portions of this program with the OpenSSL library under certain
 *    conditions as described in each individual source file and distribute
 *    linked combinations including the program with the OpenSSL library. You
 *    must comply with the GNU Affero General Public License in all respects for
 *    all of the code used other than as permitted herein. If you modify file(s)
 *    with this exception, you may extend this exception to your version of the
 *    file(s), but you are not obligated to do so. If you do not wish to do so,
 *    delete this exception statement from your version. If you delete this
 *    exception statement from all source files in the program, then also delete
 *    it in the license file.
 */

var util = require("util");
var events = require("events");
var Q = require('q');



var Bus=function(){
	events.EventEmitter.call(this);
}



Bus.prototype.listeners=function(event){
	events.EventEmitter.listenerCount(Bus, event)	
}

util.inherits(Bus, events.EventEmitter);

var bus=new Bus()

// hooking
/**
var _emit = Bus.prototype.emit;
var _on = Bus.prototype.on;

//
// make this Bus promise when no callback is used
// This is a simple hook, 
bus.emit = function (name) {
  var deferred = Q.defer();
 	var args = Array.prototype.slice.call(arguments);
 	var hasCallback=(typeof arguments[arguments.length-1]==='function');
	function emitCallback () {
	 	var args = Array.prototype.slice.call(arguments);
		if(args[0]){
			return deferred.reject(args[0]);
		}
		deferred.resolve(Array.prototype.slice.call(arguments,1));
		return;
	}
	//
	// if no callback we use promise
 	if(!hasCallback){
 		args.push(emitCallback)
 	}
  _emit.apply(bus, args);
	return deferred.promise;
};




bus.on = function (name, fn) {
  _on.call(bus, name,fn);
};
*/

module.exports=bus;