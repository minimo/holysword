phina.namespace(function() {
  phina.define("DownloadProgress", {
    superClass: "Modal",
    assets: null,

    init: function(options) {
      this.superInit();
      this.assets = options.assets;
      this.setup();
    },

    setup: function() {
      this.gaugeFrame = RectangleShape({
        fill: "white",
        stroke: null,
        cornerRadius: 12,
        width: 512,
        height: 32,
        padding: 0,
        x: SCREEN_WIDTH * 0.5,
        y: 24
      }).addChildTo(this);

      console.log(this.gaugeFrame.originX, this.gaugeFrame.originY)

      this.gauge = RectangleShape({
        fill: "orange",
        stroke: null,
        cornerRadius: 12,
        width: 506,
        height: 26,
        padding: 0,
        x: -this.gaugeFrame.width * 0.5 + 3,
        y: 0,
      }).addChildTo(this.gaugeFrame);

      this.gauge.setOrigin(0, 0.5);

      this.gauge.Gauge = Gauge().attachTo(this.gauge);
      this.gauge.Gauge.min = 0.0;
      this.gauge.Gauge.max = 1.0;
      this.setProgress(0.0);
    },

    setProgress: function(progress) {
      this.gauge.Gauge.value = progress;
    },

    //表示アニメーション
    openAnimation: function() {
      return new Promise(resolve => {
        this.alpha = 0;
        this.tweener.clear()
          .fadeIn(250)
          .wait(250)
          .call(() => resolve());
      });
    },

    //非表示アニメーション
    closeAnimation: function() {
      return new Promise(resolve => {
        this.alpha = 1;
        this.tweener.clear()
          .wait(250)
          .fadeOut(250)
          .call(() => {
            this.remove();
            resolve();
          });
      });
    },

    //追加でアセットを読み込む
    startLoadAssets: function() {
      if (!this.assets) return Promise.resolve();
      return new Promise(resolve => {
        const loader = AssetLoader();
        loader.onload = () => resolve();
        loader.onprogress = (e) => this.setProgress(e.progress);
        loader.load(this.assets);
      });
    },

    _static: {

      instance: null,

      open: function(scene, pathPref, assets) {

        assets = DownloadProgress.yetLoadedAssets(
          Root.LoadingScene.combineAssetsPath(assets, pathPref)
        );

        //シーンが存在しない場合は即座に完了にする
        if (!scene || !assets) {
          return Promise.resolve();
        }

        //すでにインスタンスが存在する場合には閉じておく
        if (this.instance) {
          this.instance.close();
          this.instance = null;
        }

        //新しく追加して表示
        this.instance = DownloadProgress({ assets }).addChildTo(scene);
        return this.instance.open()
          .then(() => this.instance.startLoadAssets())
          .then(() => {
            this.instance.close()
            this.instance = null;
          })
      },

      yetLoadedAssets: function(assets) {
        if (!assets) return null;
        const yet = {};
        assets.forIn((type, data) => {
          data.forIn((key, value) => {
            if (!phina.asset.AssetManager.get(type, key)) {
              yet[type] = yet[type] || {};
              yet[type][key] = value;
            }
          });
        });
        return (Object.keys(yet).length > 0) ? yet : null;
      }

    }

  });
});
