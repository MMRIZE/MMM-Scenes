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
