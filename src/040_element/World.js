phina.namespace(function() {

  phina.define('World', {
    superClass: 'DisplayElement',

    mapSizeW: 20,
    mapSizeH: 20,
    mapChipSize: 32,

    init: function(options) {
      this.superInit();
      this.setup();
    },

    setup: function() {
      this.mapBase = DisplayElement()
        .setPosition(SCREEN_WIDTH_HALF, SCREEN_HEIGHT_HALF)
        .addChildTo(this);
    },

    update: function() {
    },

  });

});
