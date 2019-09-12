/*
 *  phina.tiledmap.js
 *  2016/9/10
 *  @auther minimo  
 *  This Program is MIT license.
 *
 */

phina.namespace(function() {

  phina.define("phina.asset.TiledMap", {
    superClass: "phina.asset.XMLLoader",

    image: null,

    tilesets: null,
    layers: null,

    init: function() {
        this.superInit();
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
            this._parse(data);
          }
        }
      };
      xml.send(null);
    },

    //マップイメージ取得
    getImage: function(layerName) {
      if (layerName === undefined) {
        return this.image;
      } else {
        return this._generateImage(layerName);
      }
    },

    //指定マップレイヤーを配列として取得
    getMapData: function(layerName) {
      //レイヤー検索
      for(let i = 0; i < this.layers.length; i++) {
        if (this.layers[i].name == layerName) {
          //コピーを返す
          return this.layers[i].data.concat();
        }
      }
      return null;
    },

    //オブジェクトグループを取得（指定が無い場合、全レイヤーを配列にして返す）
    getObjectGroup: function(groupName) {
      groupName = groupName || null;
      const ls = [];
      const len = this.layers.length;
      for (let i = 0; i < len; i++) {
        if (this.layers[i].type == "objectgroup") {
          if (groupName == null || groupName == this.layers[i].name) {
            //レイヤー情報をクローンする
            const obj = this._cloneObjectLayer(this.layers[i]);
            if (groupName !== null) return obj;
          }
          ls.push(obj);
        }
      }
      return ls;
    },

    //オブジェクトレイヤーをクローンして返す
    _cloneObjectLayer: function(srcLayer) {
      const result = {}.$safe(srcLayer);
      result.objects = [];
      //レイヤー内オブジェクトのコピー
      srcLayer.objects.forEach(obj => {
        const resObj = {
          properties: {}.$safe(obj.properties),
        }.$extend(obj);
        if (obj.ellipse) resObj.ellipse = obj.ellipse;
        if (obj.gid) resObj.gid = obj.gid;
        if (obj.polygon) resObj.polygon = obj.polygon.clone();
        if (obj.polyline) resObj.polyline = obj.polyline.clone();
        result.objects.push(resObj);
      });
      return result;
    },

    _parse: function(data) {
      //タイル属性情報取得
      const map = data.getElementsByTagName('map')[0];
      const attr = this._attrToJSON(map);
      this.$extend(attr);
      this.properties = this._propertiesToJSON(map);

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
          const chip = {
            image: t.image,
            x: ((r - attr.firstgid) % t.columns) * (t.tilewidth + t.spacing) + t.margin,
            y: Math.floor((r - attr.firstgid) / t.columns) * (t.tileheight + t.spacing) + t.margin,
          }.$safe(attr);
          this.tilesets.chips[r] = chip;
        }
      }

      //レイヤー取得
      this.layers = this._parseLayers(data);

      //イメージデータ読み込み
      this._checkImage()
        .then(() => {
          //マップイメージ生成
          this.image = this._generateImage();
          //読み込み完了
          this._resolve(this)
        });
    },

    //タイルセットのパース
    _parseTilesets: function(xml) {
      const each = Array.prototype.forEach;
      const data = [];
      const tilesets = xml.getElementsByTagName('tileset');
      each.call(tilesets, async tileset => {
        const t = {};
        const attr = this._attrToJSON(tileset);
        if (attr.source) {
          t.source = this.path + attr.source;
        } else {
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
        }

        data.push(t);
      });
      return data;
    },

    //レイヤー情報のパース
    _parseLayers: function(xml) {
      const each = Array.prototype.forEach;
      const data = [];

      const map = xml.getElementsByTagName("map")[0];
      const layers = [];
      each.call(map.childNodes, elm => {
        if (elm.tagName == "layer" || elm.tagName == "objectgroup" || elm.tagName == "imagelayer") {
          layers.push(elm);
        }
      });

      layers.each(layer => {
        switch (layer.tagName) {
          case "layer":
            {
              //通常レイヤー
              const d = layer.getElementsByTagName('data')[0];
              const encoding = d.getAttribute("encoding");
              const l = {
                  type: "layer",
                  name: layer.getAttribute("name"),
              };

              if (encoding == "csv") {
                  l.data = this._parseCSV(d.textContent);
              } else if (encoding == "base64") {
                  l.data = this._parseBase64(d.textContent);
              }

              const attr = this._attrToJSON(layer);
              l.$extend(attr);
              l.properties = this._propertiesToJSON(layer);

              data.push(l);
            }
            break;

          //オブジェクトレイヤー
          case "objectgroup":
            {
              const l = {
                type: "objectgroup",
                objects: [],
                name: layer.getAttribute("name"),
                x: parseFloat(layer.getAttribute("offsetx")) || 0,
                y: parseFloat(layer.getAttribute("offsety")) || 0,
                alpha: layer.getAttribute("opacity") || 1,
                color: layer.getAttribute("color") || null,
                draworder: layer.getAttribute("draworder") || null,
              };
              each.call(layer.childNodes, elm => {
                if (elm.nodeType == 3) return;
                const d = this._attrToJSON(elm);
                d.properties = this._propertiesToJSON(elm);
                //子要素の解析
                if (elm.childNodes.length) {
                  elm.childNodes.forEach(e => {
                    if (e.nodeType == 3) return;
                    //楕円
                    if (e.nodeName == 'ellipse') {
                      d.ellipse = true;
                    }
                    //多角形
                    if (e.nodeName == 'polygon') {
                      d.polygon = [];
                      const attr = this._attrToJSON_str(e);
                      const pl = attr.points.split(" ");
                      pl.forEach(function(str) {
                        const pts = str.split(",");
                        d.polygon.push({x: parseFloat(pts[0]), y: parseFloat(pts[1])});
                      });
                    }
                    //線分
                    if (e.nodeName == 'polyline') {
                      d.polyline = [];
                      const attr = this._attrToJSON_str(e);
                      const pl = attr.points.split(" ");
                      pl.forEach(str => {
                        const pts = str.split(",");
                        d.polyline.push({x: parseFloat(pts[0]), y: parseFloat(pts[1])});
                      });
                    }
                  });
                }
                l.objects.push(d);
              });
              l.properties = this._propertiesToJSON(layer);

              data.push(l);
            }
            break;

          //イメージレイヤー
          case "imagelayer":
            {
              const l = {
                type: "imagelayer",
                name: layer.getAttribute("name"),
                x: parseFloat(layer.getAttribute("offsetx")) || 0,
                y: parseFloat(layer.getAttribute("offsety")) || 0,
                alpha: layer.getAttribute("opacity") || 1,
                visible: (layer.getAttribute("visible") === undefined || layer.getAttribute("visible") != 0),
              };
              const imageElm = layer.getElementsByTagName("image")[0];
              l.image = {source: imageElm.getAttribute("source")};

              data.push(l);
            }
            break;
        }
      });
      return data;
    },

    //アセットに無いイメージデータを読み込み
    _checkImage: function() {
      return new Promise(resolve => {
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
        for (let i = 0; i < this.layers.length; i++) {
          if (this.layers[i].image) {
            const obj = {
              image: this.layers[i].image.source
            };
            imageSource.push(obj);
          }
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
        const assets = { image: [] };
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
            resolve();
          });
        } else {
          resolve();
        }
      });
    },

    //マップイメージ作成
    _generateImage: function(layerName) {
      let numLayer = 0;
      for (let i = 0; i < this.layers.length; i++) {
        if (this.layers[i].type == "layer" || this.layers[i].type == "imagelayer") numLayer++;
      }
      if (numLayer == 0) return null;

      const width = this.width * this.tilewidth;
      const height = this.height * this.tileheight;
      const canvas = phina.graphics.Canvas().setSize(width, height);

      for (let i = 0; i < this.layers.length; i++) {
        //マップレイヤー
        if (this.layers[i].type == "layer" && this.layers[i].visible != "0") {
          if (layerName === undefined || layerName === this.layers[i].name) {
            const layer = this.layers[i];
            const mapdata = layer.data;
            const width = layer.width;
            const height = layer.height;
            const opacity = layer.opacity || 1.0;
            const count = 0;
            for (let y = 0; y < height; y++) {
              for (let x = 0; x < width; x++) {
                const index = mapdata[count];
                if (index !== -1) {
                  //マップチップを配置
                  this._setMapChip(canvas, index, x * this.tilewidth, y * this.tileheight, opacity);
                }
                count++;
              }
            }
          }
        }
        //オブジェクトグループ
        if (this.layers[i].type == "objectgroup" && this.layers[i].visible != "0") {
          if (layerName === undefined || layerName === this.layers[i].name) {
            const layer = this.layers[i];
            const opacity = layer.opacity || 1.0;
            layer.objects.forEach(function(e) {
              if (e.gid) {
                this._setMapChip(canvas, e.gid, e.x, e.y, opacity);
              }
            }.bind(this));
          }
        }
        //イメージレイヤー
        if (this.layers[i].type == "imagelayer" && this.layers[i].visible != "0") {
          if (layerName === undefined || layerName === this.layers[i].name) {
            const image = phina.asset.AssetManager.get('image', this.layers[i].image.source);
            canvas.context.drawImage(image.domElement, this.layers[i].x, this.layers[i].y);
          }
        }
      }

      const texture = phina.asset.Texture();
      texture.domElement = canvas.domElement;
      return texture;
    },

    //キャンバスの指定した座標にマップチップのイメージをコピーする
    _setMapChip: function(canvas, index, x, y, opacity) {
      //タイルセットからマップチップを取得
      const chip = this.tilesets.chips[index];
      const image = phina.asset.AssetManager.get('image', chip.image);
      canvas.context.drawImage(
        image.domElement,
        chip.x + chip.margin, chip.y + chip.margin,
        chip.tilewidth, chip.tileheight,
        x, y,
        chip.tilewidth, chip.tileheight);
    },

  });

  //ローダーに追加
  phina.asset.AssetLoader.assetLoadFunctions.tmx = function(key, path) {
    const tmx = phina.asset.TiledMap();
    return tmx.load(path);
  };

});