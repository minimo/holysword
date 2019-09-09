/*
 *  AssetList.js
 */

phina.namespace(function() {

  phina.define("AssetList", {
    _static: {
      loaded: [],
      isLoaded: function(assetType) {
        return AssetList.loaded[assetType]? true: false;
      },
      get: function(assetType) {
        AssetList.loaded[assetType] = true;
        switch (assetType) {
          case "preload":
            return {
              image: {
                "actor4": "assets/textures/actor4.png",
                "shadow": "assets/textures/shadow.png",
              },
            };
            case "common":
            return {
              image: {
              },
            };

          default:
            throw "invalid assetType: " + options.assetType;
        }
      },
    },
  });

});