/**
 * DomButton
 * elementにかぶせる形でDOMボタンを作成します。
 * 
 * Paramater
 * app      CanvasApp
 * element  かぶせる対象element
 * func     クリックされた時に実行される関数
 */

phina.namespace(() => {
  phina.define("DomButton", {
    superClass: "DisplayElement",

    init: function(app, element) {
      this.superInit();

      this.app = app;

      this.btn = null;
      this.setup(element);
    },

    setup: function(element) {
      if (this.btn) {
        document.body.removeChild(this.btn);
        // this.btn.remove();
      }

      this.btn = document.createElement("button");
      this.btn.id = "btn"
      this.btn.style.position = "absolute";
      this.btn.style.display = "none";
      this.btn.style.padding = "0px";
      this.btn.style.borderWidth = "0px";

      this.btn.style.filter = 'alpha(opacity=0)';
      this.btn.style.MozOpacity = 0.0;
      this.btn.style.opacity = 0.0;

      document.body.appendChild(this.btn);

      this.btn.onclick = () => {
        element.flare('clicked');
        this.flare('clicked');
      };

      this.on('enterframe', () => {
        if (!this.btn) return;
        const scale = parseInt(this.app.domElement.style.width) / this.app.domElement.width * this.app.quality;
        const width = element.width * scale;
        const height = element.height * scale;

        let canvasLeft = parseInt(this.app.domElement.style.left);
        let canvasTop = parseInt(this.app.domElement.style.top);
        //自身のグローバル座標に合わせる
        canvasLeft += element._worldMatrix.m02 * scale;
        canvasTop += element._worldMatrix.m12 * scale;
        canvasLeft += -element.originX * width;
        canvasTop += -element.originY * height;

        this.btn.style.display = "";
        this.btn.style.width = `${width}px`;
        this.btn.style.height = `${height}px`;
        this.btn.style.left = `${canvasLeft}px`;
        this.btn.style.top = `${canvasTop}px`;
      });

    },

    onremoved: function() {
      if (!this.btn) return;
      document.body.removeChild(this.btn);
      // this.btn.remove();
      this.btn = null;
    },

  });
});
