phina.namespace(function() {

  phina.define('WorldMap', {
    superClass: 'DisplayElement',

    init: function(mapName) {
      this.superInit();
      this.setup();
    },

    setup: function() {
      this.data = phina.asset.AssetManager.get('tmx', mapName);
      Sprite(this.data.getImage())
        .setOrigin(0, 0)
        .addChildTo(this);

      this.collision = [];
      const layerData = this.data.getObjectGroup("collision");
      layerData.objectes.forEach(e => {
        const p = e.properties;
        const element = DisplayElement({
          width: p.width,
          height: p.height,
          x: p.x,
          y: p.y,
        }).setOrigin(0, 0);
        this.collision.push(element);
      });
    },

  });

});
