phina.namespace(function() {

  phina.define('World', {
    superClass: 'DisplayElement',

    init: function(options) {
      this.superInit();
      this.setup();
    },

    setup: function() {
      this.mapBase = DisplayElement()
        .setPosition(SCREEN_WIDTH_HALF, SCREEN_HEIGHT_HALF)
        .addChildTo(this);

      const tmx = phina.asset.AssetManager.get('tmx', "map1");
      const image = tmx.getImage();
      Sprite(image).addChildTo(this.mapBase);

      this.player = Player().addChildTo(this.mapBase);
    },

    update: function() {
      
    },

  });

});
