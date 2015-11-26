(function(){
  var debugMode = false;
  var methods = [
   'log',
   'debug',
   'info',
   'warn',
   'error',
   'dir',
   'trace',
   'assert',
   'dirxml',
   'group',
   'groupEnd',
   'time',
   'timeEnd',
   'count',
   'profile',
   'profileEnd'
  ];

  if(typeof window.console === "undefined"){
    window.console = {};
  }

  for(var i in methods){
    (function( m ){
      if (console[m] && debugMode && typeof console[m] === "function") {
        window[m] =
          function() {
            console[m].apply( console, arguments );
          };
      }
      else{
        window[m] = function(){};
      }
    })(methods[i]);
  }
})();
