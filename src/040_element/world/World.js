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

      //マスクレイヤー設定
      this.clipMask = MultiRectangleClip().attachTo(this.mapLayer[LAYER_ACTORMASK]);
      const collision = this.map.getCollisionData();
      collision.forEach(e => {
      });
      const floor = this.map.getFloorData();

      this.player = Player()
        .setMapData(this.map)
        .addChildTo(this.mapLayer[LAYER_ACTOR]);
    },

    update: function() {
    },

  });

});
