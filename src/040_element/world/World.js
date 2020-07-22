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

      //レイヤー構築
      this.mapLayer = [];
      (NUM_LAYERS).times(i => {
        const layer = DisplayElement().addChildTo(this.mapBase);
        this.mapLayer[i] = layer;
      });

      this.player = Player()
        .setMapData(this.map)
        .addChildTo(this.mapLayer[LAYER_ACTOR]);
    },

    update: function() {
      let wx = SCREEN_WIDTH_HALF - this.player.x;
      let wy = SCREEN_HEIGHT_HALF - this.player.y;
      if (wx > 0) wx = 0;
      if (wy > 0) wy = 0;
      const limitX = SCREEN_WIDTH_HALF - this.map.width;
      const limitY = SCREEN_HEIGHT_HALF - this.map.height;
      if (wx < limitX) wx = limitX;
      if (wy < limitY) wy = limitY;
      this.mapBase.setPosition(wx, wy);
    },

  });

});
