phina.namespace(function() {

  phina.define('World', {
    superClass: 'DisplayElement',

    init: function(options) {
      this.superInit();
      this.setup();
    },

    setup: function() {
      this.mapBase = DisplayElement()
        .setPosition(0, 0)
        .addChildTo(this);

      this.map = WorldMap("map1").addChildTo(this.mapBase);

      this.mapLyer = [];

      this.player = Player()
        .setMapData(this.map)
        .addChildTo(this.mapBase);
    },

    update: function() {
    },

  });

});
