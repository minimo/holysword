phina.namespace(function() {

  const PADDING = 20;

  phina.define("Dialog", {
    superClass: "Modal",

    init: function(options) {
      this.superInit();
      options = options || {};
      this.size = options.size || Dialog.SIZE.S;

      console.log("size:" + this.size);

      this.fromJSON({
        children: {
          background: {
            className: "RectangleShape",
            arguments: {
              width: SCREEN_WIDTH,
              height: SCREEN_HEIGHT,
              stroke: null,
              fill: "#00000099"
            },
            x: SCREEN_WIDTH * 0.5,
            y: SCREEN_HEIGHT * 0.5,
          },
        }
      });

      // this.layout = AssetManager.get("layout", `dialog_${this.size}`)
      this.layout = AssetManager.get("layout", "dialog_frame")
        .build()
        .addChildTo(this);

      this.updateSize();
      this.setupButtons();
    },

    updateSize: function() {
      const dialog = this.layout.dialog;
      Dialog.SIZE.forIn((size) => {
        dialog[Dialog.SIZE[size]].sleep().hide()
      })
      this.dialog.wakeUp().show();
    },

    setupButtons: function() {
      const buttonLayout = AssetManager.get("layout", "dialog_buttons").build();
      const data = buttonLayout.layoutAsset.data;
      this._buttonJSONs = buttonLayout.layoutAsset.data.root.children;
    },

    setTitle: function(title) {
      this.title.text = title;
    },

    addButton: function(label, color, options) {
      options = options || {};

      this.buttons.fromJSON({
        children: [this._buttonJSONs[`${color}_m`]],
      });

      const button = this.buttons.children.last;

      button.Button = Button().attachTo(button);
      button.label.text = button.label_2.text = label;
      button.label.fontSize = button.label_2.fontSize = (!options.fontSize) ? button.label.fontSize : options.fontSize;
      button.position = Vector2(0, 0);
      button.hogeId = this.buttons.children.length;

      let width = this.buttons.children.reduce((w, elm) => {
        return w += elm.width + PADDING;
      }, 0);

      let left = (this.buttons.width - width) * 0.5 - (this.buttons.width * 0.5);

      this.buttons.children.forEach((elm) => {
        elm.x = left + (elm.width + PADDING) * 0.5;
        left = elm.right + PADDING * 0.5;
      });

      //this.buttons.children.forEach(e => console.log(e.position));

      return button;
    },

    //===================================
    //表示
    open: function() {
      return this.openAnimation();
    },

    //===================================
    //非表示
    close: function() {
      return this.closeAnimation();
    },

    //===================================
    //表示アニメーション
    openAnimation: function() {
      return Promise.all([
        new Promise(resolve => {
          this.background.alpha = 0;
          this.background.tweener.clear()
            .fadeIn(250)
            .call(() => resolve());
        }),
        new Promise(resolve => {
          this.layout.dialog.scaleX = 0.0;
          this.layout.dialog.scaleY = 0.0;
          this.layout.dialog.tweener.clear()
            .to({
              scaleX: 1.0,
              scaleY: 1.0
            }, 250, "easeInOutQuad")
            .call(() => {
              this.flare("opened", {
                dialog: this
              });
              resolve();
            });
        })
      ]);
    },

    //===================================
    //非表示アニメーション
    closeAnimation: function() {
      return Promise.all([
        new Promise(resolve => {
          this.background.alpha = 1;
          this.background.tweener.clear()
            .fadeOut(250)
            .call(() => resolve());
        }),
        new Promise(resolve => {
          this.layout.dialog.scaleX = 1.0;
          this.layout.dialog.scaleY = 1.0;
          this.layout.dialog.tweener.clear()
            .to({
              scaleX: 0.0,
              scaleY: 0.0
            }, 250, "easeInOutQuad")
            .call(() => {
              this.flare("closed", {
                dialog: this
              });
              resolve();
            });
        })
      ]).then(() => {
        this.remove();
        this.layout.destroy();
        delete this.layout;
        this.flare("destroy");
      });
    },

    _accessor: {
      contents: {
        get: function() {
          return this.layout.ref["contents"];
        }
      },
      dialog: {
        get: function() {
          return this.layout.dialog[this.size];
        }
      },
      title: {
        // get: function() { return this.layout.ref["title"].label; }
        get: function() {
          return this.dialog.label;
        }
      },
      buttons: {
        // get: function() { return this.layout.ref["buttons"]; }
        get: function() {
          return this.dialog.buttons;
        }
      },
    },

    _static: {
      SIZE: {
        XS: "xs", //486x307  
        S: "s", //486x396  
        M: "m", //486x466  
        L: "l", //486x586  
        XL: "xl", //546x596  
        XXL: "xxl", //546x726  
        XXXL: "xxxl" //546x956  
      },
      BUTTON_COLOR: {
        RED: "red",
        // GREEN: "green",
        BLUE: "blue",
        WHITE: "white",
      },

      open: function(scene, size, setupFunction) {
        const dialog = Dialog({
          size
        }).addChildTo(scene);

        setupFunction(dialog);
        dialog.open();

        // こうしたいが、1Frame遅れてちらつく
        // Promise.resolve()
        //   .then(() => setupFunction(dialog))
        //   .then(() => dialog.open())

        return dialog;
      },

    }
  });
});
