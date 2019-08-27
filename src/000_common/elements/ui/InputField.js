phina.namespace(() => {
  phina.define("InputField", {
    superClass: "DisplayElement",

    domElement: null,

    init: function(options) {
      this.options = ({}).$safe(options, InputField.defaults);
      this.superInit(options);

      this.domElement = document.createElement("input");
      this.domElement.type = "text";
      this.domElement.value = this.options.text;

      this.domElement.style.position = "absolute";
      this.domElement.style.display = "none";
      this.domElement.style.padding = "0px";
      this.domElement.style.borderWidth = "0px";
      document.body.appendChild(this.domElement);

      this.domElement.addEventListener("focus", () => {
        this.flare("focus");
      });

      this.domElement.addEventListener("focusout", () => {
        this.flare("focusout");
      });

      this.domElement.addEventListener("keyup", () => {
        this.flare("change");
      });

      //TODO:appの参照方法で他に良い方法があれば変更する
      this.one("enterframe", (e) => {
        this.app = e.app;
        this.setup();
      });
    },

    setup: function() {
      this.on("enterframe", () => {
        const scale = parseInt(this.app.domElement.style.width) / this.app.domElement.width * this.app.quality;

        let fontSize = (this.options.fontSize * scale).round();
        //キャンバスの左上に合わせる
        let width = this.width * scale;
        let height = this.height * scale;
        let canvasLeft = parseInt(this.app.domElement.style.left);
        let canvasTop = parseInt(this.app.domElement.style.top);

        //自身のグローバル座標に合わせる
        canvasLeft += this._worldMatrix.m02 * scale;
        canvasTop += this._worldMatrix.m12 * scale;
        //originの調整
        canvasLeft += -this.originX * width;
        canvasTop += -this.originY * height;

        this.domElement.style.display = "";
        this.domElement.style.width = `${width}px`;
        this.domElement.style.height = `${height}px`;
        this.domElement.style.left = `${canvasLeft}px`;
        this.domElement.style.top = `${canvasTop}px`;
        this.domElement.style.fontSize = `${fontSize}px`;
        this.domElement.style.fontFamiliy = "Main-Bold";
      });
    },

    setVisible: function(flag) {
      this.visible = flag;
      if (this.domElement) {
        this.domElement.style.display = (flag) ? "" : "none";
      }
      return this;
    },

    show: function() {
      this.setVisible(true);
      return this;
    },

    hide: function() {
      this.setVisible(false);
      return this;
    },

    addCSS: function(css) {
      if (css instanceof Array) {
        css.forEach((c) => {
          this.domElement.classList.add(c);
        });
      } else {
        if (this.domElement) {
          this.domElement.classList.add(css);
        }
      }
      return this;
    },

    removeCSS: function(css) {
      if (css instanceof Array) {
        css.forEach((c) => {
          this.domElement.classList.remove(c);
        });
      } else {
        if (this.domElement) {
          this.domElement.classList.remove(css);
        }
      }
      return this;
    },

    onremoved: function() {
      if (this.domElement) {
        this.domElement.remove();
      }
    },

    _accessor: {
      text: {
        "get": function() {
          return (this.domElement) ? this.domElement.value : "";
        },
        "set": function(v) {
          if (!this.domElement) return;
          this.domElement.value = v;
        }
      }
    },

    _static: {
      defaults: {
        width: 200,
        height: 40,
        fontSize: 20,
        text: "",
      }
    },
  });
});
