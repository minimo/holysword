/*
 *  phina.Tileset.js
 *  2019/9/12
 *  @auther minimo  
 *  This Program is MIT license.
 *
 */

phina.namespace(function() {

  phina.define("phina.asset.TileSet", {
    superClass: "phina.asset.XMLLoader",

    image: null,

    init: function(xml) {
        this.superInit();
        if (xml) {
          this.loadFromXML(xml);
        }
    },

    _load: function(resolve) {
      //パス抜き出し
      this.path = "";
      const last = this.src.lastIndexOf("/");
      if (last > 0) {
        this.path = this.src.substring(0, last + 1);
      }

      //終了関数保存
      this._resolve = resolve;

      // load
      const xml = new XMLHttpRequest();
      xml.open('GET', this.src);
      xml.onreadystatechange = () => {
        if (xml.readyState === 4) {
          if ([200, 201, 0].indexOf(xml.status) !== -1) {
            const data = (new DOMParser()).parseFromString(xml.responseText, "text/xml");
            this.dataType = "xml";
            this.data = data;
            this._parse(data)
              .then(() => this._resolve(this));
          }
        }
      };
      xml.send(null);
    },

    loadFromXML: function(xml) {
      return this._parse(xml);
    },

    _parse: function(data) {
      return new Promise(resolve => {
        //タイルセット取得
        this.tileset = this._parseTileset(data);

        //タイルセット情報補完
        const defaultAttr = {
          tilewidth: 32,
          tileheight: 32,
          firstgid: 1,
          spacing: 0,
          margin: 0,
        };
        this.tileset.chips = [];

        //タイルセット属性情報取得
        const attr = this._attrToJSON(data.getElementsByTagName('tileset')[0]);
        attr.$safe(defaultAttr);
        attr.firstgid--;
        this.tileset.$extend(attr);

        //マップチップリスト作成
        const t = this.tileset;
        this.tileset.mapChip = [];
        for (let r = attr.firstgid; r < attr.firstgid + attr.tilecount; r++) {
          const chip = {
            image: t.image,
            x: ((r - attr.firstgid) % t.columns) * (t.tilewidth + t.spacing) + t.margin,
            y: Math.floor((r - attr.firstgid) / t.columns) * (t.tileheight + t.spacing) + t.margin,
          }.$safe(attr);
          this.tileset.chips[r] = chip;
        }

        //イメージデータ読み込み
        this._checkImage()
          .then(() => resolve());
      });
    },

    //アセットに無いイメージデータを読み込み
    _checkImage: function() {
      return new Promise(resolve => {
        const imageSource = {
          image: this.path + this.tileset.image,
          transR: this.tileset.transR,
          transG: this.tileset.transG,
          transB: this.tileset.transB,
        };
        
        let loadImage = null;
        const image = phina.asset.AssetManager.get('image', imageSource.image);
        if (!image) {
          loadImage = imageSource;
        }

        //ロードリスト作成
        const assets = { image: [] };
        assets.image[imageSource.image] = imageSource.image;

        if (loadImage) {
          const loader = phina.asset.AssetLoader();
          loader.load(assets);
          loader.on('load', e => {
            //透過色設定反映
            const image = phina.asset.AssetManager.get('image', imageSource.image);
            if (imageSource.transR !== undefined) {
              const r = imageSource.transR;
              const g = imageSource.transG;
              const b = imageSource.transB;
              image.filter((pixel, index, x, y, bitmap) => {
                const data = bitmap.data;
                if (pixel[0] == r && pixel[1] == g && pixel[2] == b) {
                    data[index+3] = 0;
                }
              });
            }
            resolve();
          });
        } else {
          resolve();
        }
      });
    },

    //タイルセットのパース
    _parseTileset: function(xml) {
      const data = {};
      const tileset = xml.getElementsByTagName('tileset')[0];
      const props = this._propertiesToJSON(tileset);
      if (props.src) {
        data.image = props.src;
      } else {
        data.image = tileset.getElementsByTagName('image')[0].getAttribute('source');
      }
      //透過色設定取得
      data.trans = tileset.getElementsByTagName('image')[0].getAttribute('trans');
      if (data.trans) {
        data.transR = parseInt(data.trans.substring(0, 2), 16);
        data.transG = parseInt(data.trans.substring(2, 4), 16);
        data.transB = parseInt(data.trans.substring(4, 6), 16);
      }
      return data;
    },

  });

  //ローダーに追加
  phina.asset.AssetLoader.assetLoadFunctions.tsx = function(key, path) {
    const tsx = phina.asset.TileSet();
    return tsx.load(path);
  };

});