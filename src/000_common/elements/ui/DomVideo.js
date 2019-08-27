phina.namespace(() => {
  phina.define("DomVideo", {
    superClass: "DisplayElement",

    init: function(app, element) {
      this.superInit();
      this.app = app;
      this.video = null;
      this.setup(element);
    },

    setup: function(element) {
      if (this.video) {
        document.body.removeChild(this.video);
        // this.video.remove();
      }

      const video = this.video = document.createElement("video");
      video.id = "video";
      video.muted = true;

      video.style.position = "absolute";

      document.body.appendChild(video);

      this.on('enterframe', () => {
        if (!video) return;
        const scale = parseInt(this.app.domElement.style.width) / this.app.domElement.width * this.app.quality;
        const width = element.width * element.scaleX * scale;
        const height = element.height * element.scaleX * scale;

        let canvasLeft = parseInt(this.app.domElement.style.left);
        let canvasTop = parseInt(this.app.domElement.style.top);

        canvasLeft += element._worldMatrix.m02 * scale;
        canvasTop += element._worldMatrix.m12 * scale;
        canvasLeft += -element.originX * width;
        canvasTop += -element.originY * height;

        // video.style.display = "";
        video.style.width = `${width}px`;
        video.style.height = `${height}px`;
        video.style.left = `${canvasLeft}px`;
        video.style.top = `${canvasTop}px`;
      });
    },

    load: function(src) {
      this.video.src = src;
      this.video.onloadedmetadata = (() => {
        this.isLoaded = true;
        this.flare("loaded");
      });
      return this;
    },

    play: function() {
      this.video.currentTime = 0;
      this.video.play();
      this.flare("play")
    },

    onremoved: function() {
      if (!this.video) return;
      document.body.removeChild(this.video);
      // this.video.remove();
      this.video = null;
    },

  });
});
