Module.register('MMM-Scenes', {
  defaults: {
    duration: 10000,
    admitAnimation: "default",
    admitDuration: 1000,
    expelAnimation: "default",
    expelDuration: 1000,
    expelGap: 0,
    admitGap: 0,
    scenario: [],
    autoLoop: 'infinity',
    lockString: 'mmm-scenes',
    startScene: ''
  },

  start: function () {
    this.scenario = null
    this._domCreated = null
    this.Library = null
    this._domReady = new Promise((resolve, reject) => {
      this._domCreated = resolve
    })
    this._loadModule = new Promise ((resolve, reject) => {
      import ('/' + this.file("library.mjs")).then(({Scenes}) => {
        this.Scenes = Scenes
        resolve()
      })
    })

    Promise.allSettled([this._loadModule, this._domReady]).then((result) => {
      this.scenario = new this.Scenes({
        duration: this.config.duration,
        admitAnimation: this.config.admitAnimation,
        expelAnimation: this.config.expelAnimation,
        admitDuration: this.config.admitDuration,
        expelDuration: this.config.expelDuration,
        expelGap: this.config.expelGap,
        admitGap: this.config.admitGap,
        lockString: this.config.lockString,
      }, (message) => {
        this.tunnel(message)
      })
      this.scenario.setLoop(this.config.autoLoop)
      this.scenario.setScenario(this.config.scenario)
      let name = this.config.startScene || this.config.scenario[0]?.name || this.config.scenario[0]
      if (name || name.name) this.scenario.playByName(name)
    })
    
    this.timer = null
    this.sendSocketNotification('ESTABLISH')
  },

  notificationReceived: function (notification, payload, sender) {
    let callback = (payload && typeof payload.callback === 'function') ? payload.callback : () => {}
    const ready = (func) => {
      const notyet = { ok: false, index: null, name: null, message: 'Not ready yet.' }
      if (this.scenario) {
        func()
      } else {
        callback(notyet)
      }
    }
    const availableCommand = ['SCENES_NEXT', 'SCENES_PREV', 'SCENES_ACT', 'SCENES_ASK_CURRENT_SCENE']
    
    if (notification === 'DOM_OBJECTS_CREATED') {
      this._domCreated()
      this.test()
    }
    if (availableCommand.includes(notification)) {
      this.command(notification, payload)
    }   
  },

  command: function (command, payload) {
    console.log(command, payload)
    const notyet = { ok: false, index: null, name: null, message: 'Not ready yet.' }
    const callback = (payload && typeof payload.callback === 'function') ? payload.callback : () => {}
    if (!this.scenario) return callback(notyet)
    

    if (command === 'SCENES_NEXT') return this.scenario.playNext().then(callback)
    if (command === 'SCENES_PREV') return this.scenario.playPrev().then(callback)
    if (command === 'SCENES_ACT') {
      const { name = '', index = -1, options = {} } = payload
      if (name && typeof name === 'string') {
        this.scenario.playByName(name, options).then(callback)
      } else if (!isNaN(index) && index >= 0) {
        this.scenario.playByIndex(index, options).then(callback)
      }
      return
    }
    if (command === 'SCENES_ASK_CURRENT_SCENE') return callback({ ok: true,  message: 'Current scene info response', response: this.scenario.getCurrentSceneInfo() })
    return
  },

  socketNotificationReceived: function (notification, payload) {
    console.log(notification, payload)
    if (notification === 'ACTION') {
      this.command(payload?.command, payload?.payload)
    }
  }
,
  tunnel: function ({ type = null, message = null } = {}) {
    if (type === 'notification') {
      const { notification, payload } = message
      this.sendNotification(notification, Object.assign({}, payload))
    }
  },

  test: function () {
    /*
    const asleep = (ms) => {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    const payload = {
      callback: (r) => console.log(r) 
    }

    const sc = async () => {
      await asleep(400)
      console.log('NEXT')
      this.notificationReceived('SCENES_NEXT', payload)
      await asleep(400)
      console.log('NEXT')
      this.notificationReceived('SCENES_NEXT', payload)
      await asleep(4000)
      console.log('PREVIOUS')
      this.notificationReceived('SCENES_PREVIOUS', payload)
      await asleep(5000)
      console.log('ACT 0')
      this.notificationReceived('SCENES_ACT', Object.assign({}, payload, {index: 0}))
      await asleep(6000)
      console.log('NEXT')
      this.notificationReceived('SCENES_NEXT')
      await asleep(7000)
      console.log('ACT SCENE1')
      this.notificationReceived('SCENES_ACT', Object.assign({}, payload, {name: 'scene1'}))
      await asleep(8000)
      console.log('ASK')
      this.notificationReceived('SCENES_ASK_CURRENT_SCENE', payload)
    }
    sc()
    */
  }


})