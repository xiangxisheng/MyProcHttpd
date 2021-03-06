window.index = function () {
  var table_htoa = function (tableObj) {
    if (!tableObj.hasOwnProperty('Columns')) {
      alert('have no tableObj.Columns')
      return
    }
    if (!tableObj.hasOwnProperty('Rows')) {
      alert('have no tableObj.Rows')
      return
    }
    var rows = []
    for (var line in tableObj.Rows) {
      var row = {}
      for (var k in tableObj.Columns) {
        row[tableObj.Columns[k]] = tableObj.Rows[line][k]
      }
      rows.push(row)
    }
    return rows
  }
  var LTrim = function(str) {
    str = str.replace(/(^\s*)/g, "")
    str = str.replace(/(^\_*)/g, "")
    return str;
  }
  var getParams = function (PARAMETERS) {
    const ret = []
    const params = PARAMETERS.split(',')
    for (var i = 0; i < params.length; i++) {
      const param = params[i].split('|')
      if (param.length < 3) continue
      row = {}
      row['name'] = LTrim(param[0])
      row['title'] = dictionary_name_to_title(row['name'])
      row['type'] = param[1]
      ret.push(row)
    }
    return ret
  }
  var objectToString = function (obj) {
    var str = Object.keys(obj).map(function(key){ 
      return encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]);
    }).join('&')
    return str
  }
  var is_empty = function (_input) {
    if (_input === null) {
      return true
    }
    const _typeof = typeof(_input)
    if (_typeof === 'string' && _input.length == 0) {
      return true
    }
    if (_typeof === 'number' && _input == 0) {
      return true
    }
    return false
  }
  var dictionary_name_to_title = function(name) {
    var obj = {};
    obj['firadio_uc'] = '认证中心';
    obj['firadio_ucenter'] = '用户中心';
    obj['firadio_yun'] = '云服务';
    obj['email'] = '邮箱';
    obj['session'] = '会话';
    obj['user'] = '用户';
    obj['ntuser'] = '域用户';
    obj['tenpay'] = '财付通';
    obj['date'] = '日期';
    obj['process'] = '耗点记录';
    obj['log'] = '日志';
    obj['list'] = '列表';
    obj['gt10w'] = '超10万点数'
    obj['cdn'] = '分布式节点'
    obj['balance'] = '余额'
    obj['qquin'] = 'QQ号码'
    obj['username'] = '用户名'
    obj['time3600'] = '小时号'
    obj['days'] = '天数'
    obj['lastseconds'] = '最近秒数'
    obj['hour'] = '小时'
    obj['file'] = '文件'
    if (obj.hasOwnProperty(name)) {
      return obj[name];
    }
  }
  new Vue({
    el: '#app',
    created: function() {
      this.update()
    },
    data: {
      config: {
        project: '',
        module: '',
        object: '',
        action: '',
        test: 0
      },
      table: {
        hashRows: [],
        project: [],
        test: 0
      },
      PMOA: {
        project: {},
        module: {},
        object: {},
        action: {}
      },
      http_request: {
        method: 'get',
        urlpre: window.location.protocol + '//' + window.location.hostname + ':' + window.location.port,
        path: '/proc',
        query: '',
        urlfull: '',
        params: {}
      },
      http_response: {
        raw: '',
        data: {
          Table: {
            Columns: [],
            Rows: []
          }
        }
      }
    },
    methods: {
      click1: function () {
        // 刷新proc数据
        this.update()
      },
      click2: function () {
        // 执行行为操作
        const rows = this.PMOA.action[this.config_pmoa()]
        this.http_request.params = {}
        for (var i = 0; i < rows.length; i++) {
          const row = rows[i]
          if (!row.hasOwnProperty('value')) {
            continue;
          }
          this.http_request.params[row.name] = row.value
        }
        this.http_request.query = objectToString(this.http_request.params)
        this.click3()
      },
      click3: function () {
        var sUrlFull = this.http_request.urlpre + this.http_request.path
        if (this.http_request.query) {
          sUrlFull += '?' + this.http_request.query
        }
        this.http_request.urlfull = sUrlFull
        // 发起HTTP请求
        this.$http.get(sUrlFull).then(function (res) {
          if (!is_empty(res.data.Message)) {
            alert("接口返回错误：" + res.data.Message)
            // return
          }
          this.http_response.raw = JSON.stringify(res.data)
          this.http_response.data = res.data
        }, function (res) {
          alert('error in http: ' + res.status)
        })
      },
      select_action_change: function () {
        this.http_request.path = '/proc/' + this.config.project + '/' + this.config.module + '_' + this.config.object + '_' + this.config.action
      },
      update: function () {
        this.$http.get('/proc', {}).then(function (res) {
          if (!is_empty(res.data.Message)) {
            alert("接口返回错误：" + res.data.Message)
            // return
          }
          this.table.hashRows = table_htoa(res.data.Table)
          this.procTable(this.table.hashRows)
          this.select_action_change()
        }, function (res) {
          alert(res.status)
        })
      },
      rand: function (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min
      },
      rand_char: function (charstr) {
        return charstr.substr(this.rand(0, charstr.length - 1), 1)
      },
      rand_arr: function (arr) {
        return arr[this.rand(0, arr.length - 1)]
      },
      getName: function (len) {
        var ret = ''
        for (var i = 0; i < len; i++) {
          ret += this.rand_char('abcdefghijklmnopqrstuvwxyz')
        }
        ret += '@firadio.com'
        return ret
      },
      procTable: function (tableObj) {
        for (var key in tableObj) {
          const row = tableObj[key]
          if (!this.procRow(row)) {
            continue
          }
          
          var key = row.SPECIFIC_SCHEMA
          if (!this.PMOA.project.hasOwnProperty(key)) {
            const obj = {}
            obj.name = row.SPECIFIC_SCHEMA
            obj.title = dictionary_name_to_title(obj.name)
            this.PMOA.project[key] = []
            this.table.project.push(obj)
          }
          var key = row.SPECIFIC_SCHEMA + '_' + row.module
          if (!this.PMOA.module.hasOwnProperty(key)) {
            const obj = {}
            obj.name = row.module
            obj.title = dictionary_name_to_title(obj.name)
            this.PMOA.project[row.SPECIFIC_SCHEMA].push(obj)
            this.PMOA.module[key] = []
          }
          var key = row.SPECIFIC_SCHEMA + '_' + row.module + '_' + row.object
          if (!this.PMOA.object.hasOwnProperty(key)) {
            const obj = {}
            obj.name = row.object
            obj.title = dictionary_name_to_title(obj.name)
            this.PMOA.module[row.SPECIFIC_SCHEMA + '_' + row.module].push(obj)
            this.PMOA.object[key] = []
          }
          var key = row.SPECIFIC_SCHEMA + '_' + row.module + '_' + row.object + '_' + row.action
          if (!this.PMOA.action.hasOwnProperty(key)) {
            const obj = {}
            obj.name = row.action
            obj.title = dictionary_name_to_title(obj.name)
            this.PMOA.object[row.SPECIFIC_SCHEMA + '_' + row.module + '_' + row.object].push(obj)
            this.PMOA.action[key] = getParams(row.PARAMETERS)
          }
        }
        // console.log(this.PMOA)
      },
      procRow: function (row) {
        arr = row.SPECIFIC_NAME.split('_')
        if (arr.length <= 1) return false
        row.module = arr[1]
        if (arr.length <= 2) return false
        row.object = arr[2]
        if (arr.length <= 3) return false
        row.action = arr[3]
        return true
      },
      config_pmoa: function () {
        return this.config.project + '_' + this.config.module + '_' + this.config.object + '_' + this.config.action
      },
      exist_pmoa: function () {
        return this.PMOA.action.hasOwnProperty(this.config_pmoa())
      },
      count_PMOA: function () {
        return this.PMOA.action[this.config_pmoa()].length
      },
      count_TableRows: function () {
        if (!this.http_response.data.Table.hasOwnProperty('Rows')) {
          return 0
        }
        if (this.http_response.data.Table.Rows === null) {
          return 0
        }
        return this.http_response.data.Table.Rows.length
      },
      count_TableColumns: function () {
        if (!this.http_response.data.Table.hasOwnProperty('Columns')) {
          return 0
        }
        if (this.http_response.data.Table.Columns === null) {
          return 0
        }
        return this.http_response.data.Table.Columns.length
      }
    }
  })
}
