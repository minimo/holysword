phina.namespace(function() {

  phina.define('PlayerAttack', {
    superClass: 'DisplayElement',

    init: function(options) {
      this.superInit(options);
      this.weaponId = options.weaponId;
    },

  });

});
