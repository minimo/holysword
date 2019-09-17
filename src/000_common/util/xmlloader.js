/*
 *  phina.xmlloader.js
 *  2019/9/12
 *  @auther minimo  
 *  This Program is MIT license.
 *
 */

phina.namespace(function() {

  phina.define("phina.asset.XMLLoader", {
    superClass: "phina.asset.Asset",

    init: function() {
        this.superInit();
    },

    _load: function(resolve) {
      resolve();
    },

    //XMLプロパティをJSONに変換
    _propertiesToJSON: function(elm) {
      const properties = elm.getElementsByTagName("properties")[0];
      const obj = {};
      if (properties === undefined) return obj;

      for (let k = 0; k < properties.childNodes.length; k++) {
        const p = properties.childNodes[k];
        if (p.tagName === "property") {
          //propertyにtype指定があったら変換
          const type = p.getAttribute('type');
          const value = p.getAttribute('value');
          if (!value) value = p.textContent;
          if (type == "int") {
            obj[p.getAttribute('name')] = parseInt(value, 10);
          } else if (type == "float") {
            obj[p.getAttribute('name')] = parseFloat(value);
          } else if (type == "bool" ) {
            if (value == "true") obj[p.getAttribute('name')] = true;
            else obj[p.getAttribute('name')] = false;
          } else {
            obj[p.getAttribute('name')] = value;
          }
        }
      }
      return obj;
    },

    //XML属性をJSONに変換
    _attrToJSON: function(source) {
      const obj = {};
      for (let i = 0; i < source.attributes.length; i++) {
        let val = source.attributes[i].value;
        val = isNaN(parseFloat(val))? val: parseFloat(val);
        obj[source.attributes[i].name] = val;
      }
      return obj;
    },

    //XML属性をJSONに変換（Stringで返す）
    _attrToJSON_str: function(source) {
      const obj = {};
      for (let i = 0; i < source.attributes.length; i++) {
        const val = source.attributes[i].value;
        obj[source.attributes[i].name] = val;
      }
      return obj;
    },

    //CSVパース
    _parseCSV: function(data) {
      const dataList = data.split(',');
      const layer = [];

      dataList.each(elm => {
        const num = parseInt(elm, 10);
        layer.push(num);
      });

      return layer;
    },

    /**
     * BASE64パース
     * http://thekannon-server.appspot.com/herpity-derpity.appspot.com/pastebin.com/75Kks0WH
     * @private
     */
    _parseBase64: function(data) {
      const dataList = atob(data.trim());
      const rst = [];

      dataList = dataList.split('').map(e => e.charCodeAt(0));

      for (let i = 0, len = dataList.length / 4; i < len; ++i) {
        const n = dataList[i*4];
        rst[i] = parseInt(n, 10);
      }

      return rst;
    },
  });

});