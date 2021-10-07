import { Animation } from './animations.mjs'

function asleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

var _sendMessage = () => {}

class Animator {
  static factory (animation) {
    if (typeof animation === 'string') animation = Animation[animation] || Animator.defaultAnimation
    if (typeof animation === 'function') return animation
    if (Array.isArray(animation) || typeof animation === 'object') return Animator.keyframeWrapper()
    
  }

  static keyframeWrapper() {
    return function ({ moduleWrapper, duration, isHide }, keyframe) {
      return new Promise((resolve, reject) => {
        moduleWrapper.animate(keyframe, { duration }).onfinish = resolve
      })
    }
  }

  static defaultAnimation ({moduleWrapper, duration, isHide}) {
    return new Promise((res, rej) => {
      moduleWrapper.style.transition = "opacity " + duration / 1000 + "s"
      moduleWrapper.style.opacity = (isHide) ? 0 : 1 
      setTimeout(() => {
        res()
      }, duration)
    })
  }
}

class Scene {
  #config
  #id
  #index
  #name
  constructor({scene, config = {}, index = null}) {
    let name 
    if (typeof scene === 'string') {
      name = scene
      scene = {}
    } else if (typeof scene.name === 'string') {
      name = scene.name
    }
    if (!name) return null
    this.#name = name
    this.#config = Object.assign({}, config, scene)
    this.#id = Date.now() + Math.floor(Math.random() * 100)
    this.#index = index
  }

  get name () {
    return this.#name
  }

  get id () {
    return this.#id
  }

  get duration () {
    return this.#config.duration
  }

  get index () {
    return this.#index
  }

  get info () {
    return {
      name: this.#name,
      index: this.#index,
      config: this.#config
    }
  }

  cloneScene (newConfig = {}) {
    return new Scene({
      scene: this.#name,
      index: this.#index,
      config: Object.assign({}, this.#config, newConfig)
    })
  }

  async expel() {
    let modulesToKill = MM.getModules().exceptWithClass(this.#name)
    let promises = []
    for (let module of modulesToKill) {
      if (module.hidden) module.hide(0, { lockString: this.#config.lockString })
      let moduleWrapper = document.getElementById(module.identifier)
      if (!moduleWrapper) continue
      let duration = this.#config.expelDuration
      promises.push(new Promise((resolve, reject) => {
        Animator.factory(this.#config.expelAnimation)({module, moduleWrapper, duration, isHide: true }, this.#config.expelAnimation).then(() => {
          module.hide(0, resolve, { lockString: this.#config.lockString })
        })
      }))
      if (this.#config.expelGap) await asleep(this.#config.expelGap)
    }
    await Promise.allSettled(promises)
    return    
  }

  async admit() {
    let modulesToRevive = MM.getModules().withClass(this.#name)
    let promises = []
    for (let module of modulesToRevive) {
      let moduleWrapper = document.getElementById(module.identifier)
      if (!moduleWrapper) continue
      if (!module.hidden) continue
      if (!module.lockString || module.lockString.length === 0 || (module.lockString.length === 1 && module.lockString.includes(this.#config.lockString))) {
        promises.push(new Promise((resolve, reject) => {
          module.show(0, { lockString: this.#config.lockString })
          let duration = this.#config.admitDuration
          Animator.factory(this.#config.admitAnimation)({module, moduleWrapper, duration, isHide: false }, this.#config.admitAnimation).then(resolve)
        }))
      }
      if (this.#config.admitGap) await asleep(this.#config.admitGap)
    }
    //await _sleep(this.admitDuration)
    await Promise.allSettled(promises)
    return    
  }
}

class Scenes {
  #scenes
  #defaults
  #autoLoop
  #_curSceneIndex
  #_curSceneId
  #_sceneTimer
  #_curSceneInfo

  constructor(defaultValues, tunnel = () => {}) {
    this.#scenes = []
    let defaults = {
      duration: 1000 * 60,
      admitAnimation: 'default',
      expelAnimation: 'default',
      admitDuration: 2000,
      expelDuration: 2000,
      lockString: 'mmm-scenes',
    }
    this.#defaults = Object.assign({}, defaults, defaultValues)
    this.#autoLoop = 'infinity'
    this.#_sceneTimer = null
    _sendMessage = tunnel
  }

  #add(scene, index = null) {
    let s = new Scene({
      scene, 
      index,
      config: this.#defaults,
    })
    if (s) this.#scenes.push(s)
  }

  setLoop(loop) { // resreved for dynamic configuration
    this.#autoLoop = (['no', 'once', 'infinity'].includes(loop)) ? loop : 'infinity'
  }

  setDefaults(defaults) { // reserved for dynamic configuration
    this.#defaults = Object.assign({}, this.#defaults, defaults)
  }

  setScenario(scenes) {
    this.#scenes = []
    for (let i = 0; i < scenes.length; i++) {
      let c = scenes[i]
      this.#add(c, i)
    }
  }

  async playScene(scene, options) {
    clearTimeout(this.#_sceneTimer)
    let newScene = scene.cloneScene(options)
    this.#_curSceneId = newScene.id
    this.#_curSceneIndex = newScene.index
    this.#_curSceneInfo = newScene.info
    if (newScene.id === this.#_curSceneId) await newScene.expel()
    if (newScene.id === this.#_curSceneId) await newScene.admit()
    if (newScene.id === this.#_curSceneId) {
      if (this.#autoLoop !== 'no') {
        this.#_sceneTimer = setTimeout(() => {
          if (newScene.id === this.#_curSceneId) this.playNext()
        }, newScene.duration)
      } 
      return { ok: true, index: newScene.index, name: newScene.name, message: 'Success to play the scene' }
    }
    return { ok: false, index: newScene.index, name: newScene.name, message: 'Scene is interrupted.' }
  }

  async playNext(options) {
    const { nextIndex } = this.#getIndexInfo(this.#_curSceneIndex)
    return await this.playByIndex(nextIndex, options)
  }

  async playPrev(options) {
    const { prevIndex } = this.#getIndexInfo(this.#_curSceneIndex)
    return await this.playByIndex(prevIndex, options)
  }

  async playByIndex(index, options) {
    if (this.#scenes?.[index]) {
      return await this.playScene(this.#scenes[index], options)
    }
    return { ok: false, index: null, name: null, message: 'Invalid scene index.' }
  }

  async playByName(name, options) {
    let scene = this.#requestSceneByName(name)
    if (scene) return await this.playScene(scene, options)
    return { ok: false, index: null, name: null, message: 'Invalid scene name.' }
  }

  #requestSceneByName(name) {
    let index = this.#scenes.findIndex((s) => {
      return s.name === name
    })
    if (index < 0) return new Scene({scene: name, config: this.#defaults, index: null})
    return this.#scenes[index]
  }

  #getIndexInfo(index) {
    let prevIndex, nextIndex
    if (this.#scenes?.[index]) {
      prevIndex = (index > 0) ? index - 1 : ((this.#autoLoop === 'once') ? null : this.#scenes.length - 1)
      nextIndex = (index < this.#scenes.length - 1) ? index + 1 : ((this.#autoLoop === 'once') ? null : 0)
    } else {
      index = null
      prevIndex = null
      nextIndex = null
    }
    return { index, prevIndex, nextIndex }
  }

  getCurrentSceneInfo() {
    let {nextIndex, prevIndex, index} = this.#getIndexInfo(this.#_curSceneIndex)
    
    let result = {
      scenario: [...this.#scenes],
      autoLoop: this.#autoLoop,
      nextIndex, prevIndex
    }

    return Object.assign({}, result, this.#_curSceneInfo)
  }
}

export { Scenes }