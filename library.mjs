/* global MM */
import { Animation } from './animations.mjs'

function asleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

let _sendMessage = () => {}

class Animator {
  static factory (animation) {
    if (typeof animation === 'string') {
      animation = Animation[animation] || Animator.defaultAnimation
    }

    if (typeof animation === 'function') {
      return animation
    }
    if (Array.isArray(animation) || typeof animation === 'object') {
      return Animator.keyframeWrapper()
    }
  }

  static keyframeWrapper () {
    return function ({ moduleWrapper, duration, isExpel }, keyframe) {
      return new Promise((resolve, reject) => {
        moduleWrapper.animate(keyframe, { duration }).onfinish = resolve
      })
    }
  }

  static defaultAnimation ({ moduleWrapper, duration, isExpel }) {
    return new Promise((resolve, reject) => {
      moduleWrapper.style.transition = 'opacity ' + duration / 1000 + 's'
      moduleWrapper.style.opacity = isExpel ? 0 : 1
      setTimeout(() => {
        resolve()
      }, duration)
    })
  }
}

class Scene {
  #options
  #id
  #index
  #name
  constructor ({ scene, options = {}, index = null }) {
    let name
    if (typeof scene === 'string') {
      name = scene
      scene = {}
    } else if (typeof scene.name === 'string') {
      name = scene.name
    }
    if (!name) return null
    this.#name = name
    this.#options = Object.assign({}, options, scene)
    this.#id = Date.now() + Math.floor(Math.random() * 100)
    this.#index = index
  }

  get name () {
    return this.#name
  }

  get options () {
    return this.#options
  }

  get id () {
    return this.#id
  }

  get duration () {
    return this.#options.duration
  }

  get index () {
    return this.#index
  }

  get info () {
    return {
      name: this.#name,
      index: this.#index,
      options: this.#options
    }
  }

  cloneScene (newConfig = {}) {
    return new Scene({
      scene: this.#name,
      index: this.#index,
      options: Object.assign({}, this.#options, newConfig)
    })
  }

  async expel () {
    const modulesToKill = MM.getModules().exceptWithClass(this.#name)
    const promises = []
    for (const module of modulesToKill) {
      if (module.hidden) {
        module.hide(0, () => { }, { lockString: this.#options.lockString })
      }
      const moduleWrapper = document.getElementById(module.identifier)
      if (!moduleWrapper) continue
      const duration = this.#options.expelDuration
      promises.push(
        new Promise((resolve, reject) => {
          Animator.factory(this.#options.expelAnimation)(
            { module, moduleWrapper, duration, isExpel: true },
            this.#options.expelAnimation
          ).then(() => {
            module.hide(0, resolve, { lockString: this.#options.lockString })
          })
        })
      )
      if (this.#options.expelGap) await asleep(this.#options.expelGap)
    }
    await Promise.allSettled(promises)
  }

  async admit () {
    const modulesToRevive = MM.getModules().withClass(this.#name)
    const promises = []
    for (const module of modulesToRevive) {
      const moduleWrapper = document.getElementById(module.identifier)
      if (!moduleWrapper) continue
      if (!module.hidden) continue
      if (
        !module.lockString ||
        module.lockString.length === 0 ||
        (module.lockString.length === 1 &&
          module.lockString.includes(this.#options.lockString))
      ) {
        promises.push(
          new Promise((resolve, reject) => {
            module.show(0, () => { }, { lockString: this.#options.lockString })
            const duration = this.#options.admitDuration
            Animator.factory(this.#options.admitAnimation)(
              { module, moduleWrapper, duration, isExpel: false },
              this.#options.admitAnimation
            ).then(resolve)
          })
        )
      }
      if (this.#options.admitGap) await asleep(this.#options.admitGap)
    }
    // await _sleep(this.admitDuration)
    await Promise.allSettled(promises)
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

  constructor (defaultValues, tunnel = () => {}) {
    this.#scenes = []
    const defaults = {
      duration: 1000 * 60,
      admitAnimation: 'default',
      expelAnimation: 'default',
      admitDuration: 2000,
      expelDuration: 2000,
      lockString: 'mmm-scenes'
    }
    this.#defaults = Object.assign({}, defaults, defaultValues)
    this.#autoLoop = 'infinity'
    this.#_sceneTimer = null
    _sendMessage = tunnel
  }

  #add (scene, index = null) {
    const s = new Scene({
      scene,
      index,
      options: this.#defaults
    })
    if (s) this.#scenes.push(s)
  }

  setLoop (loop) {
    // resreved for dynamic optionsuration
    this.#autoLoop = ['no', 'once', 'infinity'].includes(loop)
      ? loop
      : 'infinity'
  }

  setDefaults (defaults) {
    // reserved for dynamic optionsuration
    this.#defaults = Object.assign({}, this.#defaults, defaults)
  }

  setScenario (scenes) {
    this.#scenes = []
    for (let i = 0; i < scenes.length; i++) {
      const c = scenes[i]
      this.#add(c, i)
    }
  }

  async playScene (scene, options) {
    clearTimeout(this.#_sceneTimer)
    const newScene = scene.cloneScene(options)
    this.#_curSceneId = newScene.id
    this.#_curSceneIndex = newScene.index
    this.#_curSceneInfo = newScene.info
    _sendMessage({
      type: 'notification',
      message: {
        notification: 'SCENES_CHANGED',
        payload: {
          name: newScene.name,
          index: newScene.index,
          duration: newScene.duration,
          scenario: this.#scenes.map(s => {
            return s.name
          }),
          autoLoop: this.#autoLoop,
          options: newScene.options
        }
      }
    })
    if (newScene.id === this.#_curSceneId) await newScene.expel()
    if (newScene.id === this.#_curSceneId) await newScene.admit()
    if (newScene.id === this.#_curSceneId) {
      if (this.#autoLoop !== 'no') {
        this.#_sceneTimer = setTimeout(() => {
          if (newScene.id === this.#_curSceneId) this.playNext()
        }, newScene.duration)
      }
      return {
        ok: true,
        index: newScene.index,
        name: newScene.name,
        message: 'Success to play the scene'
      }
    }
    return {
      ok: false,
      index: newScene.index,
      name: newScene.name,
      message: 'Scene is interrupted.'
    }
  }

  async playNext (options) {
    const { nextIndex } = this.#getIndexInfo(this.#_curSceneIndex)
    return await this.playByIndex(nextIndex, options)
  }

  async playPrev (options) {
    const { prevIndex } = this.#getIndexInfo(this.#_curSceneIndex)
    return await this.playByIndex(prevIndex, options)
  }

  async playByIndex (index, options) {
    if (this.#scenes?.[index]) {
      return await this.playScene(this.#scenes[index], options)
    }
    return {
      ok: false,
      index: null,
      name: null,
      message: 'Invalid scene index.'
    }
  }

  async playByName (name, options) {
    const scene = this.#requestSceneByName(name)
    if (scene) return await this.playScene(scene, options)
    return {
      ok: false,
      index: null,
      name: null,
      message: 'Invalid scene name.'
    }
  }

  #requestSceneByName (name) {
    const index = this.#scenes.findIndex(s => {
      return s.name === name
    })
    if (index < 0) {
      return new Scene({ scene: name, options: this.#defaults, index: null })
    }
    return this.#scenes[index]
  }

  #getIndexInfo (index) {
    let prevIndex, nextIndex
    if (this.#scenes?.[index]) {
      prevIndex =
        index > 0
          ? index - 1
          : this.#autoLoop === 'once'
            ? null
            : this.#scenes.length - 1
      nextIndex =
        index < this.#scenes.length - 1
          ? index + 1
          : this.#autoLoop === 'once'
            ? null
            : 0
    } else {
      index = null
      prevIndex = null
      nextIndex = null
    }
    return { index, prevIndex, nextIndex }
  }

  getCurrentSceneInfo () {
    const { nextIndex, prevIndex } = this.#getIndexInfo(this.#_curSceneIndex)

    const result = {
      scenario: [
        ...this.#scenes.map(s => {
          return s.name
        })
      ],
      autoLoop: this.#autoLoop,
      nextIndex,
      prevIndex
    }

    return Object.assign({}, result, this.#_curSceneInfo)
  }
}

export { Scenes }
