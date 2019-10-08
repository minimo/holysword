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

      this.sprite = Sprite("actor4", 32, 32)
        .setFrameIndex(0)
        .addChildTo(this.base);

      this.sprite_mask = Sprite("actor4_mask", 32, 32)
        .setFrameIndex(0)
        .addChildTo(this.mask);
      this.sprite_mask.alpha = 0.8;

      this.rectangleClip = MultiRectangleClip().attachTo(this.mask);

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
      const { resultCollision, resultFloor } = this.check(x, y);
      const res1 = resultCollision;
      const res2 = resultFloor;
      if (this.beforeFrame.collision.isCover && !this.beforeFrame.floor.isBridge) res2.isBridge = false;
      if (!res1.isCollision && res2.isCollision && res2.isOnFloor || res2.isBridge) {
        this.x += this.vx;
        this.y += this.vy;

        this.calcCover();

        //他フロアへ行く為のブリッジにいるか判定
        if (res2.isBridge) {
          this.floorNumber = res2.floorNumber;
          this.x -= this.vx; //ブリッジは横移動出来ない
          this.rectangleClip.clearClipRect();
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

    check: function(x, y) {
      const ox = this.x;
      const oy = this.y;
      this.x = x;
      this.y = y;
      this._calcWorldMatrix();
      this.collision._calcWorldMatrix();

      const resultCollision = {
        isCollision: false,
        isCover: false,
      };
      this.collisionData.forEach(e => {
        if (this.collision.hitTestElement(e)) {
          if (e.floorNumber[this.floorNumber]) {
            resultCollision.isCollision = true;
          } else {
            for (let i = this.floorNumber + 1; i < e.floorNumber.length; i++) {
              if (e.floorNumber[i]) {
                resultCollision.isCover = true;
              }
            }
          }
        }
        if (this.hitTestElement(e)) {
          if (!e.floorNumber[this.floorNumber]) {
            for (let i = this.floorNumber + 1; i < e.floorNumber.length; i++) {
              if (e.floorNumber[i]) {
                this.coverData.push(e);
              }
            }
          }
        }
      });

      const resultFloor = {
        isCollision: false,
        isCover: false,
        isBridge: false,
        floorNumber: 0,
        isOnFloor: false,
      };
      if (this.floorNumber == 0) {
        resultFloor.isCollision = true;
        resultFloor.isOnFloor = true;
      }
      this.floorData.forEach(e => {
        if (this.collision.hitTestElement(e)) {
          if (e.bridge) {
            resultFloor.isCollision = true;
            resultFloor.isBridge = true;
          } else if (e.floorNumber[this.floorNumber]) {
            resultFloor.isCollision = true;
          } else {
            for (let i = this.floorNumber + 1; i < e.floorNumber.length; i++) {
              if (e.floorNumber[i]) {
                resultFloor.isCover = true;
                resultFloor.floorNumber = i;
              }
            }
          }
          if (e.includeElement(this.collision)) {
            resultFloor.isOnFloor = true;
          }
        }
        if (this.hitTestElement(e)) {
          if (!e.bridge && !e.floorNumber[this.floorNumber]) {
            for (let i = this.floorNumber + 1; i < e.floorNumber.length; i++) {
              if (e.floorNumber[i]) {
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
      return { resultCollision, resultFloor };
    },

    //キャラクタに対し、カバーされた領域のクリップを作成
    calcCover: function() {
      this.rectangleClip.clearClipRect();
      this.coverData.forEach(e => {
        const rect = {
          x: e.x - this.x - e.width * 0.5,
          y: e.y - this.y - e.height * 0.5,
          width: e.width,
          height: e.height,
        };
        this.rectangleClip.addClipRect(rect)
      });
    },

  });

});
