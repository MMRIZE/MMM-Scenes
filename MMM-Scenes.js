Module.register('MMM-Scenes', {
  defaults: {
    duration: 10000,
    admitAnimation: 'default',
    admitDuration: 1000,
    expelAnimation: 'default',
    expelDuration: 1000,
    expelGap: 0,
    admitGap: 0,
    scenario: [],
    autoLoop: 'infinity',
    lockString: 'mmm-scenes',
    startScene: '',
    inactiveIndicators: ['○'],
    activeIndicators: ['●']
  },

  getStyles: function () {
    return ['MMM-Scenes.css']
  },

  // TelegramBot integration
  getCommands: function(commander) {
    commander.add(
      {
        // Adds Telegram command '/scene'
        // Usage: /scene [info|next|prev]
        //   or   /scene name:<scene name>
        //   to play the scene named 'scene1' in the scenario:
        //   /scene name:scene1
        command: 'scene',
        description: "Play next|prev|name:str\nTry `/scene next`.",
        callback: 'command_scene',
        args_pattern : ['info|next|prev', "/name:([a-z]+)/"],
        args_mapping : ["nextprev", "scenename"]
      }
    )
    commander.add(
      {
        // Adds Telegram command '/scene_index'
        // Usage: /scene_index <scene index>
        //   e.g. to play the second defined scene in the scenario:
        //   /scene_index 1
        command: 'scene_index',
        description: "Play scene by index\nTry `/scene_index 1`.",
        callback: 'command_scene_index',
        args_pattern : ["/([0-9]+)/"],
        args_mapping : ["sceneindex"]
      }
    )
  },

  // Callback for /scene Telegram command
  command_scene: function(command, handler) {
    var scene_info = this.scenario.getCurrentSceneInfo()
    var { scenario, index, name } = scene_info
    if (handler.args['nextprev'] == 'info') {
      handler.reply("TEXT", "Scene name: " + name)
    }
    if (handler.args['nextprev'] == 'next') {
      this.scenario.playNext()
      scene_info = this.scenario.getCurrentSceneInfo()
      var { scenario, index, name } = scene_info
      handler.reply("TEXT", "Playing next scene\nScene name: " + name)
    }
    if (handler.args['nextprev'] == 'prev') {
      this.scenario.playPrev()
      scene_info = this.scenario.getCurrentSceneInfo()
      var { scenario, index, name } = scene_info
      handler.reply("TEXT", "Playing previous scene\nScene name: " + name)
    }
    if (handler.args['scenename'][1]) {
      if (typeof handler.args['scenename'][1] === 'string') {
        const scene_name = handler.args['scenename'][1]
        this.scenario.playByName(scene_name)
        scene_info = this.scenario.getCurrentSceneInfo()
        var { scenario, index, name } = scene_info
        handler.reply("TEXT", "Playing scene by name: " +
                               scene_name + "\nScene index: " + index)
      }
    }
  },

  // Callback for /scene_index Telegram command
  command_scene_index: function(command, handler) {
    if (handler.args['sceneindex'][0]) {
      var scene_index = handler.args['sceneindex'][0]
      if (!isNaN(scene_index)) {
        if (scene_index >= 0) {
          this.scenario.playByIndex(scene_index)
          const scene_info = this.scenario.getCurrentSceneInfo()
          const { scenario, index, name } = scene_info
          handler.reply("TEXT", "Playing scene index " +
                                 scene_index.toString() +
                                 "\nScene name: " + name)
        }
      }
    }
  },

  start: function () {
    this.ready = false
    this.scenario = null
    this._domCreated = null
    this.Library = null
    this._domReady = new Promise((resolve, reject) => {
      this._domCreated = resolve
    })
    this._loadModule = new Promise((resolve, reject) => {
      import('/' + this.file('library.mjs')).then(({ Scenes }) => {
        this.Scenes = Scenes
        resolve()
      })
    })

    Promise.allSettled([this._loadModule, this._domReady]).then(result => {
      this.scenario = new this.Scenes(
        {
          duration: this.config.duration,
          admitAnimation: this.config.admitAnimation,
          expelAnimation: this.config.expelAnimation,
          admitDuration: this.config.admitDuration,
          expelDuration: this.config.expelDuration,
          expelGap: this.config.expelGap,
          admitGap: this.config.admitGap,
          lockString: this.config.lockString
        },
        message => {
          this.tunnel(message)
        }
      )
      this.scenario.setLoop(this.config.autoLoop)
      this.scenario.setScenario(this.config.scenario)
      this.ready = true
      const name =
        this.config.startScene ||
        this.config.scenario[0]?.name ||
        this.config.scenario[0]
      if (name || name.name) this.scenario.playByName(name)
    })

    this.timer = null
    this.sendSocketNotification('ESTABLISH')
  },

  notificationReceived: function (notification, payload, sender) {
    const availableCommand = [
      'SCENES_NEXT',
      'SCENES_PREV',
      'SCENES_ACT',
      'SCENES_CURRENT'
    ]

    if (notification === 'DOM_OBJECTS_CREATED') {
      this._domCreated()
    }
    if (availableCommand.includes(notification)) {
      this.command(notification, payload)
    }
  },

  command: function (command, payload) {
    const notyet = {
      ok: false,
      index: null,
      name: null,
      message: 'Not ready yet.'
    }
    const userFunc =
      payload && typeof payload.callback === 'function'
        ? payload.callback
        : () => {}
    if (!this.scenario) return userFunc(notyet)
    const { name = '', index = -1, options = {} } = payload
    if (command === 'SCENES_NEXT') {
      return this.scenario.playNext(options).then(userFunc)
    }
    if (command === 'SCENES_PREV') {
      return this.scenario.playPrev(options).then(userFunc)
    }
    if (command === 'SCENES_ACT') {
      if (name && typeof name === 'string') {
        this.scenario.playByName(name, options).then(userFunc)
      } else if (!isNaN(index) && index >= 0) {
        this.scenario.playByIndex(index, options).then(userFunc)
      }
      return
    }
    if (command === 'SCENES_CURRENT') {
      return userFunc({
        ok: true,
        message: 'Current scene info response',
        response: this.scenario.getCurrentSceneInfo()
      })
    }

    return userFunc({ ok: false, message: 'Invalid command' })
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === 'ACTION') {
      this.command(payload?.command, payload?.payload)
    }
  },
  tunnel: function ({ type = null, message = null } = {}) {
    if (type === 'notification') {
      const { notification, payload } = message
      this.sendNotification(notification, Object.assign({}, payload))
      if (notification === 'SCENES_CHANGED') {
        this.drawIndicator(
          Number(payload?.options?.expelDuration) +
            Number(payload?.options?.admitDuration)
        )
      }
    }
  },

  drawIndicator: function (duration = 0) {
    this.updateDom(duration)
  },

  getDom: function () {
    const dom = document.createElement('div')
    dom.classList.add('scenes_indicator')
    if (!this.ready) return dom
    const info = this.scenario.getCurrentSceneInfo()
    const { scenario, index, name } = info

    if (isNaN(index) || index < 0) {
      const d = document.createElement('span')
      d.classList.add('scenes_indicator_scene')
      d.classList.add('out_of_range_scene')
      d.innerHTML = name
      dom.appendChild(d)
      return dom
    }

    const inactiveIndicators = Array.from(scenario, (el, ix) => {
      return (
        this.config.inactiveIndicators?.[ix] ||
        this.config.inactiveIndicators[
          this.config.inactiveIndicators.length - 1
        ]
      )
    })

    const activeIndicators = Array.from(scenario, (el, ix) => {
      return (
        this.config.activeIndicators?.[ix] ||
        this.config.activeIndicators[this.config.activeIndicators.length - 1]
      )
    })

    for (let i = 0; i < inactiveIndicators.length; i++) {
      const d = document.createElement('span')
      d.classList.add('scenes_indicator_scene')
      d.classList.add('index_' + i)
      if (i === 0) {
        d.classList.add('first')
      }
      if (i === inactiveIndicators.length - 1) {
        d.classList.add('last')
      }
      if (index === i) {
        d.classList.add('active')
        d.innerHTML = activeIndicators[i]
      } else {
        d.classList.add('inactive')
        d.innerHTML = inactiveIndicators[i]
      }
      dom.appendChild(d)
    }

    return dom
  }
})
