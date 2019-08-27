/*
 *  TitleScene.js
 */

phina.namespace(function() {

  phina.define('TitleScene', {
    superClass: 'BaseScene',

    _static: {
      isAssetLoad: false,
    },

    init: function(options) {
      this.superInit();

      this.unlock = false;
      this.loadcomplete = false;
      this.progress = 0;

      //ロード済みならアセットロードをしない
      if (TitleScene.isAssetLoad) {
        this.setup();
      } else {
        //preload asset
        const assets = AssetList.get("preload")
        this.loader = phina.asset.AssetLoader();
        this.loader.load(assets);
        this.loader.on('load', () => this.setup());
        TitleScene.isAssetLoad = true;
      }
    },

    setup: function() {
      const back = RectangleShape({ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, fill: "black" })
        .setPosition(SCREEN_WIDTH_HALF, SCREEN_HEIGHT_HALF)
        .addChildTo(this);
      this.registDispose(back);

      const label = Label({ text: "TitleScene", fill: "white" })
        .setPosition(SCREEN_WIDTH_HALF, SCREEN_HEIGHT_HALF)
        .addChildTo(this);
      this.registDispose(label);

      //テクスチャ編集
      new Promise(resolve => {
        const tex = phina.asset.AssetManager.get("image", "unit");
        let trans = null;
        tex.filter((pixel, index, x, y, bitmap) => {
            var data = bitmap.data;
            //左上のピクセルの色をを透過色とする
            if (x == 0 && y == 0) {
              trans = data;
              data[index + 3] = 0;
              return;
            }
            if (trans[0] == pixel[0] && trans[1] == pixel[1] && trans[2] == pixel[2]) {
              data[index + 3] = 0;
            }
        });
        // phina.asset.AssetManager.set("image", name+"White", tex);

        back.setInteractive(true);
        back.on('pointend', () => this.exit("main"));
        resolve();
      })

    },

    update: function() {
    },

  });

});
