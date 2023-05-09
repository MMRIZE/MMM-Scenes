# MMM-Scenes

> **“Life is a theatre set in which there are but few practicable entrances.”**
>  
> ― Victor Hugo, Les Misérables


MagicMirror module to change screen scenes by time and order with **ANIMATION EFFECT**.

## Demo
[![MMM-Scenes Demo](https://img.youtube.com/vi/FRQuO8sY-DI/maxresdefault.jpg) Click To Play](https://www.youtube.com/watch?v=FRQuO8sY-DI)



## TOC
- [MMM-Scenes](#mmm-scenes)
  * [Demo](#demo)
  * [Concept](#concept)
  * [Features](#features)
  * [Install](#install)
  * [Config](#config)
  * [Global options](#global-options)
  * [Assign scene to modules](#assign-scene-to-modules)
  * [Describe scenes in `scenario`](#describe-scenes-in-scenario)
  * [Animation](#animation)
    + [- `predefined animation name`](#--predefined-animation-name)
    + [- `keyframe array or object`](#--keyframe-array-or-object)
    + [- `custom animation function`](#--custom-animation-function)
  * [Notifications & WebAPI endpoints](#notifications--webapi-endpoints)
    + [Incoming notifications](#incoming-notifications)
      - [`SCENES_NEXT`, payload: { callback, options }](#scenes_next-payload--callback-options-)
      - [`SCENES_PREV`, payload: { callback, options }](#scenes_prev-payload--callback-options-)
      - [`SCENES_ACT`, payload: { callback, options, name, index }](#scenes_act-payload--callback-options-name-index-)
      - [`SCENES_CURRENT`, payload: { callback }](#scenes_current-payload--callback-)
    + [Outgoing notification](#outgoing-notification)
      - [`SCENES_CHANGED`, payload: { name, index, duration, scenario, autoLoop }](#scenes_changed-payload--name-index-duration-scenario-autoloop-)
    + [WebAPI endpoints](#webapi-endpoints)
      - [GET /scenes/next](#get-scenesnext)
      - [GET /scenes/prev](#get-scenesprev)
      - [GET /scenes/act/:indexNumber](#get-scenesactindexnumber)
      - [GET /scenes/act/:sceneName](#get-scenesactscenename)
    + [TelegramBot integration](#telegrambot-integration)
      - [TelegramBot installation](#telegrambot-installation)
      - [Telegram usage](#telegram-usage)
  * [Indicators](#indicators)
  * [Predefined animation](#predefined-animation)
  * [Info](#info)
    + [Memo](#memo)
    + [History](#history)
      - [1.0.0 (2021-10-12)](#100-2021-10-12)
    + [Author](#author)

## Concept
The scenario of the MM screen is made up of a series of scenes. Each module has its role in its appearance scenes to enter and exit by design. 

When a scene begins, all modules whose roles end, will be expelled, and all modules that have the parts in that scene will be admitted.

As described in the scenario, your MM screen will play a drama with modules.


## Features
- control show/hide modules by assigning scene names into the module's class
- custom animations for modules expel/admit
- control scenes by notification and WebURL endpoints.
- Loop control
- custom indicators

## Install
```sh
cd ~/MagicMirror/modules
git clone https://github.com/MMRIZE/MMM-Scenes
cd MMM-Scenes
npm install
```

## Config
```js
{
  module: "MMM-Scenes",
  position: 'bottom_right', // Position of indicator
  classes: "scene1 scene2 scene3", // Even indicator needs the direction when it is presented.
  hiddenOnStartup: true,
  config: {
    scenario: [ "scene1", "scene2", "scene3"],
    // other options...
  }
}
```
You can find an example in th `examples` directory.
## Global options
These options will apply to each scene unless defined in the scene newly. All the properties are omittable, and if omitted, a default value will be used.
|**property**|**default**|**description**|
|---|---|---|
|`scenario`| [] | The order-set of scenes. You can set the scene name(class name) or scene definition (object) as the items of this property.| 
|`autoLoop`| "infinity"| Looping scenes in `scenario`. <br> Available values: `"no"`, `"once"`, `"infinity"` <br> Default Value: `"infinity"`|
|`startScene`| '' | (optional) If set, this scene will be displayed on startup. If omitted, the first scene of `scenario` will be displayed at first.|
|`duration`|10000| (ms) When the next scene will come after the current scene starts. On `autoLoop = no`, this will be ignored. |
|`admitAnimation`| "default" | When the scene starts, how the modules will appear. See [animation](#animation)|
|`admitDuration`|1000| (ms) speed of `admitAnimation`|
|`admitGap`|0| (ms) the entrance gap of modules in `admitAnimation`<br> In `admitGap = 0` all roled modules will enter together, in `admitGap = 500` each roled module will enter sequentially with 500ms of delay. |
|`expelAnimation` |"default"| Before the new scene starts, how unrolled modules will be expelled. See [animation](#animation)|
|`expelDuration` | 1000| (ms) speed of `expelAnimation`|
|`expelGap`|0| (ms) the exit gap of modules in `expelAnimation`|
|`lockString`|"mmm-scenes"| Lock-key of MM's locking mechanism. Generally, you don't need to touch. |
|`inactiveIndicators`| ['○'] | Array of inactive scene indicators See [indicators](#indicators) |
|`activeIndicators`| ['●'] | Array of active scene indicators. See [indicators](#indicators)

## Assign scene to modules

Usually, A scene is defined as text. If you want some module to admit into the specific scene, give the scene name as the module's class name. 
```js
{
  module: "clock",
  position: "top_left",
  classes: "scene1 scene3"
},
{
  module: "helloworld",
  position: "top_right",
  classes: "scene2"
}
```
In this example, the `clock` module will appear in `scene1` and `scene3` and will be expelled from `scene2` or `scene4`. `helloworld` module will appear only in `scene2`.

## Describe scenes in `scenario`

In the module's configuration, you can describe `scenario` with which scenes will appear by order.
```js
config: {
  scenario: ["scene1", "scene2", "scene1", "scene3", "scene1", "scene4"],
}
```
All the scenes have the same global properties by default. But you can specify a scene with scene definitions in `scenario`.
```js
config: {
  duration: 10 * 60 * 1000,
  scenario: [
    "scene1", 
    "scene2",
    {
      name: "scene3",
      duration: 30 * 60 * 1000,
      admitAnimation: "jelly"
    },
    "scene4"
  ],
}

```
In this example, `scene1`, `scene2` and `scene4` will have `10 * 60 * 1000` as `duration` and default animations, but `scene3` will have `30 * 60 * 1000` with `jelly` style admitAnimation. 

`scene object (scene3)` should have `name` property. Other available properties are `admitAnimation`, `admitDuration`, `admitGap`, `expelAnimation`, `expelDuration`, `expelGap` and `duration`

## Animation
`admitAnimation` and `expelAnimation` would point which animation effect would be applied to each scene transition.
They could have three types of values as a definition of animation.

### - `predefined animation name`
Some predefined animation behaviours are prepared in `animation.mjs` file. You can select one of them for your animation effect. 
```js
expelAnimation: "jelly",
admitAnimation: "pageDown"
```

### - `keyframe array or object` 
Or you can set a `keyframe` array or object for your own custom animation. (See [reference](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Keyframe_Formats))
```js
expelAnimation: [ // keyframe array
  { opacity: 1, transform: 'scale(1, 1)' },
  { opacity: 0.5, transform: 'scale(0.5, 1)' },
  { opacity: 0, transform: 'scale(0, 0)' }
],
admitAnimation: { // keyframe object
  opacity: [ 0, 0.9, 1 ],
  offset: [ 0, 0.8 ], 
  easing: [ 'ease-in', 'ease-out' ],
},
```

### - `custom animation function`
Or you can assign your custom animation function to control more detailly. The animation function should return `Promise` or be `async function` to know when the animation finishes.
```js
expelAnimation: async ({ moduleWrapper, duration }) => {
  const asleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  moduleWrapper.style.transition = 'opacity ' + duration / 1000 + 's'
  moduleWrapper.style.opacity = 0
  await asleep(duration)
  return
},
admitAnimation: ({ moduleWrapper, duration, module }) => {
  const position = (pos) => {
    if (pos.search("_left") >= 0) return "(-50vw, 0)";
    if (pos.search("_right") >= 0) return "(50vw, 0)";
    if (pos.search("top_bar") >= 0 || pos.search("upper") >= 0 || pos.search("middle") >= 0) return "(0, 50vh)";
    if (pos.search("bottom_bar") >= 0 || pos.search("lower") >= 0) return "(0, 50vh)";
    return "(0,0)";
  };
  const value = position(module.data.position)
  let keyframe = [
    { transform: 'translate(0, 0)', opacity: 1, easing: 'ease-out' },
    { transform: `translate${value}`, opacity: 0, easing: 'ease-in' },
  ];
  return new Promise((resolve, reject) => {
    moduleWrapper.animate(keyframe, { duration }).onfinish = resolve
  })
},
```

You can also add your custom animation function into `animation.mjs` file, then use it's name simply.

An animation function will get `DefinitionObject { moduleWrapper, module, duration, isExpel }` argument. Return value has to be a `Promise`.

```js
animation = async (DefinitionObject) => {
  const {
    moduleWrapper, // HTML Dom of target module
    module, // MM module itself
    duration, // Animation duration
    isExpel, // Only valid in 'animation.mjs'
  } = DefinitionObject
  console.log(module.name) // do your stuff
  ...
  return  
}
```

## Notifications & WebAPI endpoints
### Incoming notifications
- Each incoming notification could have a `callback` function as a member of the payload. It will be called when your notification requesting is done, and `admitAnimation` is finished.
```js
this.sendNotification('SCENE_NEXT', {
  callback: (response) => { console.log(response.ok) }
})
```
- You can override animation for this instant scene changing with `payload.options`.
```js
this.sendNotification('SCENE_ACT', {
  index: 1,
  options: {
    duration: 30 * 60 * 1000,
    admitAnimation: 'jelly', // or keyframe or custom animation function
    admitDuration: 2000,
  }
})
```
#### `SCENES_NEXT`, payload: { callback, options }
Play next scene. If the current scene is not inside the `scenario`, the next scene will be the first scene(index: 0).

#### `SCENES_PREV`, payload: { callback, options }
Play previous scene. If the current scene is not inside of `scenario`, the previous scene doesn't exist. 

#### `SCENES_ACT`, payload: { callback, options, name, index }
Play specific scene. 

- With the `name` payload, It will show the modules which have that name as a class. If not exists, no module will appear. (Empty screen)

- With the `index` payload, It will show the Nth module of the scenario. If with the wrong index, nothing will happen. The index is zero-based. (index:0 => first scene, index:1 => second scene)

- If `name` and `index` are used together simultaneously, `name` is primary to `index`.


#### `SCENES_CURRENT`, payload: { callback }
Ask about the current scene. The `callback` function will get a data object as an argument.
```js
this.sendNotification('SCENES_CURRENT' { callback: (info) => {
  console.log(info)
  /*
  `info` will have something like these;
  {
    scenario: [...],
    nextIndex,
    prevIndex,
    index,
    name,
    duration,
    options: { ... },
    ...
  }
  */
}})
```

### Outgoing notification
#### `SCENES_CHANGED`, payload: { name, index, duration, scenario, autoLoop }
When a scene is changed, this notification will be emitted.



### WebAPI endpoints
You can access MM url to control this module from outside of MM. e.g.) IFTTT.
#### GET /scenes/next
Play next scene.

#### GET /scenes/prev
Play previous scene
#### GET /scenes/act/:indexNumber
Play specific scene by given index
```
http://localhost/scenes/act/1
```

#### GET /scenes/act/:sceneName
Play specific scene by given name
```
http://localhost/scenes/act/scene2
```


### TelegramBot integration
You can control MMM-Scenes using the Telegram app by installing the
[MMM-TelegramBot](https://github.com/eouia/MMM-TelegramBot)
module and adding MMM-TelegramBot configuration to your scenes.

#### Telegram usage
Once installed and configured, you can control your MMM-Scenes display
by sending messages in the Telegram app to your previously created Telegram Bot.
The supported commands are as follows:

- /scene info
- /scene next
- /scene prev
- /scene name:scenename
- /scene_index &lt;number&gt;

For example, to play the scene named 'scene1' in the scenario, issue the command:

```
/scene name:scene1
```

To play scene index 2 in the scenario, issue the command:

```
/scene_index 2
```



## Indicators
```js
inactiveIndicators: ['○'],
activeIndicators: ['●'],
```

```js
inactiveIndicators: ['①', '②', '③'],
activeIndicators: ['❶', '❷', '❸']
```

```js
inactiveIndicators: [''],
activeIndicators: ['Today', 'Family', 'Ent.'],
```

```js
inactiveIndicators: ['1', '2', '3'],
activeIndicators: ['1', '2', '3'],
```

- When the current scene does not belong to `scenario`, the `scene name` will be displayed instead of the scene indicator

- When the number of indicators is less than that of `scenario`, the last item will be applied to the rest. (the first example or the third example.)

- You can decorate the indicators with CSS  in your `custom.css`; The HTML created will be like this
```html
<div class="scenes_indicator">
  <span class="scenes_indicator_scene index_0 inactive first">○</span>
  <span class="scenes_indicator_scene index_1 active">●</span> <!-- current scene -->
  <span class="scenes_indicator_scene index_2 inactive last">○</span>
<div>
```
```css
/* Just an example */
.scenes_indicator_scene {
  margin-left: 5px;
  margin-right: 5px;
  display: inline-block;
}

.scenes_indicator_scene.inactive {
  color: #999;
}

.scenes_indicator_scene.active {
  color: orange;
  font-weight: bold;
}

.scenes_indicator_scene.first::before {
  content: "[ "
}
.scenes_indicator_scene.last::after {
  content: " ]"
}
```

## Predefined animation
- See [animations.mjs.origin](./animations.mjs.origin). It will be copied to `animations.mjs`. You can add your custom animation definition in that file. (PR will be welcomed for more animations.)



## Info
### Memo
- RPI3 or older/weaker SBC doesn't have enough power to handle the animation. In that case, just use animation `default` or avoid serious effects.

### History
#### 1.1.0 (2021-11-01)
- **ADDED** : `MMM-TelegramBot` commandable. (Thanks to @doctorfree)
#### 1.0.0 (2021-10-12)
- released


### Author
- Seongnoh Yi (eouia0819@gmail.com)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/Y8Y56IFLK)

