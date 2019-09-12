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

    init: function() {
        this.superInit();
    },

    _load: function(resolve) {
      //パス抜き出し
      this.path = "";
      const last = this.src.lastIndexOf("/");
      if (last > 0) {
        this.path = this.src.substring(0, last+1);
      }

      //終了関数保存
      this._resolve = resolve;

      // load
      const xml = new XMLHttpRequest();
      xml.open('GET', this.src);
      xml.onreadystatechange = () => {
        if (xml.readyState === 4) {
          if ([200, 201, 0].indexOf(xml.status) !== -1) {
            var data = xml.responseText;
            data = (new DOMParser()).parseFromString(data, "text/xml");
            this.dataType = "xml";
            this.data = data;
            this._parse(data);
          }
        }
      };
      xml.send(null);
    },

    _parse: function(data) {
      //タイルセット取得
      this.tilesets = this._parseTilesets(data);

      //タイルセット情報補完
      const defaultAttr = {
        tilewidth: 32,
        tileheight: 32,
        spacing: 0,
        margin: 0,
      };
      this.tilesets.chips = [];
      for (let i = 0; i < this.tilesets.length; i++) {
        //タイルセット属性情報取得
        const attr = this._attrToJSON(data.getElementsByTagName('tileset')[i]);
        attr.$safe(defaultAttr);
        attr.firstgid--;
        this.tilesets[i].$extend(attr);

        //マップチップリスト作成
        const t = this.tilesets[i];
        this.tilesets[i].mapChip = [];
        for (let r = attr.firstgid; r < attr.firstgid+attr.tilecount; r++) {
          var chip = {
            image: t.image,
            x: ((r - attr.firstgid) % t.columns) * (t.tilewidth + t.spacing) + t.margin,
            y: Math.floor((r - attr.firstgid) / t.columns) * (t.tileheight + t.spacing) + t.margin,
          }.$safe(attr);
          this.tilesets.chips[r] = chip;
        }
      }

      //イメージデータ読み込み
      this._checkImage();
    },

    //アセットに無いイメージデータを読み込み
    _checkImage: function() {
      const imageSource = [];
      const loadImage = [];

      //一覧作成
      for (let i = 0; i < this.tilesets.length; i++) {
        const obj = {
          image: this.tilesets[i].image,
          transR: this.tilesets[i].transR,
          transG: this.tilesets[i].transG,
          transB: this.tilesets[i].transB,
        };
        imageSource.push(obj);
      }

      //アセットにあるか確認
      for (let i = 0; i < imageSource.length; i++) {
        const image = phina.asset.AssetManager.get('image', imageSource[i].image);
        if (image) {
          //アセットにある
        } else {
          //なかったのでロードリストに追加
          loadImage.push(imageSource[i]);
        }
      }

      //一括ロード
      //ロードリスト作成
      const assets = {
        image: []
      };
      for (let i = 0; i < loadImage.length; i++) {
        //イメージのパスをマップと同じにする
        assets.image[imageSource[i].image] = this.path+imageSource[i].image;
      }
      if (loadImage.length) {
        const loader = phina.asset.AssetLoader();
        loader.load(assets);
        loader.on('load', e => {
          //透過色設定反映
          loadImage.forEach(elm => {
            const image = phina.asset.AssetManager.get('image', elm.image);
            if (elm.transR !== undefined) {
              const r = elm.transR;
              const g = elm.transG;
              const b = elm.transB;
              image.filter((pixel, index, x, y, bitmap) => {
                const data = bitmap.data;
                if (pixel[0] == r && pixel[1] == g && pixel[2] == b) {
                    data[index+3] = 0;
                }
              });
            }
          });
          //読み込み終了
          this._resolve(this);
        });
      } else {
        //読み込み終了
        this._resolve(this);
      }
    },

    //タイルセットのパース
    _parseTilesets: function(xml) {
      const each = Array.prototype.forEach;
      const data = [];
      const tilesets = xml.getElementsByTagName('tileset');
      each.call(tilesets, tileset => {
        const t = {};
        const props = this._propertiesToJSON(tileset);
        if (props.src) {
          t.image = props.src;
        } else {
          t.image = tileset.getElementsByTagName('image')[0].getAttribute('source');
        }
        //透過色設定取得
        t.trans = tileset.getElementsByTagName('image')[0].getAttribute('trans');
        if (t.trans) {
          t.transR = parseInt(t.trans.substring(0, 2), 16);
          t.transG = parseInt(t.trans.substring(2, 4), 16);
          t.transB = parseInt(t.trans.substring(4, 6), 16);
        }
        data.push(t);
      });
      return data;
    },

  });

  //ローダーに追加
  phina.asset.AssetLoader.assetLoadFunctions.tsx = function(key, path) {
    var tsx = phina.asset.TileSet();
    return tsx.load(path);
  };

});