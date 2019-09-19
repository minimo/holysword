phina.namespace(function() {

  phina.define('WorldMap', {
    superClass: 'DisplayElement',

    init: function(mapName) {
      this.superInit();
      this.setup(mapName);
    },

    setup: function(mapName) {
      this.data = phina.asset.AssetManager.get('tmx', mapName);
      Sprite(this.data.getImage())
        .setOrigin(0, 0)
        .addChildTo(this);

      this.collision = this.layerToArray("collision");
      this.floorData = this.layerToArray("floor");
    },

    getCollisionData: function() {
      return this.collision;
    },

    getFloorData: function() {
      return this.floorData;
    },

    layerToArray: function(layerName) {
      const result = [];
      const layerData = this.data.getObjectGroup(layerName);
      layerData.objects.forEach(e => {
        const element = DisplayElement({
          width: e.width,
          height: e.height,
          x: e.x + e.width / 2,
          y: e.y + e.height / 2,
        }).addChildTo(this);
        element.properties = e.properties;
        result.push(element);
      });
      return result;
    },

  });

});
