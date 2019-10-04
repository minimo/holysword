phina.namespace(function() {

  phina.define('Player', {
    superClass: 'Actor',

    mapData: null,
    collisionData: null,
    floorData: null,

    coverData: null,

    init: function() {
      this.superInit({ width: 32, height: 32 });

      this.setShadow();

      this.sprite_mask = Sprite("actor4_mask", 32, 32)
        .setFrameIndex(0)
        .addChildTo(this);
      this.sprite_mask.alpha = 0.5;

      this.base = DisplayElement().addChildTo(this)

      this.sprite = Sprite("actor4", 32, 32)
        .setFrameIndex(0)
        .addChildTo(this.base);

      this.rectangleClip = RectangleClip().attachTo(this.base);

      this.nowAnimation = "down";

      this.weapon = Sprite("weapons", 16, 16)
        .setFrameIndex(0)
        .disable()
        .addChildTo(this);

      this.coverData = [];
    },

    update: function() {
      this.vx = 0;
      this.vy = 0;
      this.isAnimation = false;

      const app = phina_app;
      const ctrl = app.controller;
      let animationName = "";
      if (ctrl.up) {
        this.vy = -2;
        animationName = "up";
      } else if (ctrl.down) {
        this.vy = 2;
        animationName = "down";
      }
      if (ctrl.left) {
        this.vx = -2;
        animationName += "left";
      } else if (ctrl.right) {
        this.vx = 2;
        animationName += "right";
      }

      if (ctrl.attack) {
        if (!this.isAttack) {
          this.isAttack = true;
        }
      }

      if (ctrl.up || ctrl.down || ctrl.left || ctrl.right || this.isJump || this.isAttack) this.isAnimation = true;
      this.setAnimation(animationName);

      const x = this.x + this.vx;
      const y = this.y + this.vy;

      //キャラクタが影に入る当たり判定の配列
      this.coverData = [];

      //マップ当たり判定
      const res1 = this.checkCollision(x, y);
      const res2 = this.checkFloor(x, y);
      if (this.beforeFrame.collision.isCover && !this.beforeFrame.floor.isBridge) res2.isBridge = false;
      if (!res1.isCollision && res2.isCollision && res2.isOnFloor || res2.isBridge) {
        this.x += this.vx;
        this.y += this.vy;

        //裏に回っているかの判定
        if (res1.isCover || res2.isCover) {
          // this.alpha = 0.5;
          // this.calcCover();
        } else {
          this.alpha = 1.0;
          this.rectangleClip.x = 0
          this.rectangleClip.y = 0
          this.rectangleClip.width = 32;
          this.rectangleClip.height = 32;
        }

        //他フロアへ行く為のブリッジにいるか判定
        if (res2.isBridge) {
          this.alpha = 1.0;
          this.floorNumber = res2.floorNumber;
          this.x -= this.vx; //ブリッジは横移動出来ない
        }
      }

      if (ctrl.jump && !res2.isBridge) {
        if (!this.isJump) {
          this.isJump = true;
          this.sprite.tweener.clear()
            .by({ y: -32 }, 250, "easeOutSine")
            .by({ y: 32 }, 250, "easeInSine")
            .call(() => this.isJump = false)
        }
      }

      if (this.x < 16) this.x = 16;
      if (this.y < 16) this.y = 16;

      this.sprite_mask.x = this.sprite.x;
      this.sprite_mask.y = this.sprite.y;

      this.beforeFrame.collision = res1;
      this.beforeFrame.floor = res2;
      this.beforeFrame.floorNumber = this.floorNumber;
    },

    setupAnimation: function() {
      this.spcialAnimation = false;
      this.frame = [];
      this.frame["stand"] = [13, 14];
      this.frame["jump"] = [36, "stop"];

      this.frame["up"] =   [ 9, 10, 11, 10];
      this.frame["down"] = [ 0,  1,  2,  1];
      this.frame["left"] = [ 3,  4,  5,  4];
      this.frame["right"] = [ 6,  7,  8,  7];
      this.frame["downleft"] = [ 48,  49,  50,  49];
      this.frame["upleft"] = [ 51,  52,  53,  52];
      this.frame["downright"] = [ 54,  55,  56,  55];
      this.frame["upright"] = [ 57,  58,  59,  58];


      this.frame["attack"] = [ 41, 42, 43, 44, "stop"];
      this.frame["damage"] = [ 18, 19, 20];
      this.frame["drop"] = [18, 19, 20];
      this.frame["dead"] = [18, 19, 20, 33, 34, 35, "stop"];
      this.frame["clear"] = [24, 25, 26];
      this.frame["stun"] = [ 18, 19, 20];
      this.index = -1;
      return this;
    },

    setMapData: function(mapData) {
      this.mapData = mapData;
      this.collisionData = mapData.getCollisionData();
      this.floorData = mapData.getFloorData();
      return this;
    },

    checkCollision: function(x, y) {
      const ox = this.x;
      const oy = this.y;
      this.x = x;
      this.y = y;
      this._calcWorldMatrix();
      this.collision._calcWorldMatrix();
      let result = {
        isCollision: false,
        isCover: false,
      };
      this.collisionData.forEach(e => {
        if (this.collision.hitTestElement(e)) {
          if (e.floorNumber[this.floorNumber]) {
            result.isCollision = true;
          } else {
            for (let i = this.floorNumber + 1; i < e.floorNumber.length; i++) {
              if (e.floorNumber[i]) {
                result.isCover = true;
                this.coverData.push(e);
              }
            }
          }
        }
      });
      this.x = ox;
      this.y = oy;
      this._calcWorldMatrix();
      this.collision._calcWorldMatrix();
      return result;
    },

    checkFloor: function(x, y) {
      const ox = this.x;
      const oy = this.y;
      this.x = x;
      this.y = y;
      this._calcWorldMatrix();
      this.collision._calcWorldMatrix();
      let result = {
        isCollision: false,
        isCover: false,
        isBridge: false,
        floorNumber: 0,
        isOnFloor: false,
      };
      if (this.floorNumber == 0) {
        result.isCollision = true;
        result.isOnFloor = true;
      }
      this.floorData.forEach(e => {
        if (this.collision.hitTestElement(e)) {
          if (e.bridge) {
            result.isCollision = true;
            result.isBridge = true;
          } else if (e.floorNumber[this.floorNumber]) {
              result.isCollision = true;
          } else {
            for (let i = this.floorNumber + 1; i < e.floorNumber.length; i++) {
              if (e.floorNumber[i]) {
                result.isCover = true;
                result.floorNumber = i;
                this.coverData.push(e);
              }
            }
          }
          if (e.includeElement(this.collision)) {
            result.isOnFloor = true;
          }
        }
      });
      this.x = ox;
      this.y = oy;
      this._calcWorldMatrix();
      this.collision._calcWorldMatrix();
      return result;
    },

    //キャラクタに対し、カバーされた領域の計算
    calcCover: function() {
      const width_half = this.width * 0.5;
      const height_half  = this.height * 0.5;
      let x1 = 0;
      let y1 = 0;
      let x2 = 32;
      let y2 = 32;

      let isFull = false;

      this.coverData.forEach(e => {
        if (isFull) return;
        const ex1 = e.x - this.x + width_half - e.width * 0.5;
        const ey1 = e.y - this.y + height_half - e.height * 0.5;
        const ex2 = ex1 + e.width;
        const ey2 = ey1 + e.height;
        //フルカバー判定
        if (ex1 < 0 && ey1 < 0 && ex2 > 32 && ey2 > 32) isFull = true;
        if (!isFull) {
        }
      });

      if (isFull) {
        x1 = y1 = 0;
        x2 = y2 = 0;
      }

      this.rectangleClip.x = x1;
      this.rectangleClip.y = y1;
      this.rectangleClip.width = x2 - x1;
      this.rectangleClip.height = y2 - y1;
    },

  });

});
