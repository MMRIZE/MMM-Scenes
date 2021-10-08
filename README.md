# MMM-Scenes

> **“Life is a theatre set in which there are but few practicable entrances.”**
>  
> ― Victor Hugo, Les Misérables


MagicMirror module to change screen scenes by time and order with **ANIMATION EFFECT**.

## Demo



## Concept
The scenario of MM screen is made up of a series of sceans. Each module has its role in its appearnace scenes, so they will enter and exit as the scenario. 

When a scene begins, all modules who's role is finished, will be expelled, and all modules who have the roles in that scene, will be admitted.

As describe the scenario of modules, your MM screen will play a drama.


## Features
- control show/hide modules by assigning scene names into module's class
- custom animations for module's expel/admit
- control scenes by notification and WebURL endpoints.
- Loop control

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
## Global options
These options will apply to each scenes unless defined in the scene newly. All the properties are omittable and if omitted, default value will be used.
|**property**|**default**|**description**|
|---|---|---|
|`scenario`| [] | The order-set of scenes. You can set the scene name(class name) or scene definition (object) as the items of this property.| 
|`autoLoop`| "infinity"| Looping scenes in `scenario`. <br> Available values: `"no"`, `"once"`, `"infinity"` <br> Default Value: `"infinity"`|
|`startScene`| '' | (optional) If set, this scene will be displayed on startup. If omitted, the first scene of `scenario` will be displayed at first.|
|`duration`|10000| (ms) When the next scene will come after current scene starts. On `autoLoop = no`, this will be ignored. |
|`admitAnimation`| "default" | When the scene starts, how the modules will appear. See [animation](#animation)|
|`admitDuration`|1000| (ms) speed of `admitAnimation`|
|`admitGap`|0| (ms) the enterance gap of modules in `admitAnimation`<br> In `admitGap = 0` all roled modules will enter together, in `admitGap = 500` each roled module will enter sequentially with 500ms of delay. |
|`expelAnimation` |"default"| Before new scene starts, how unroled modules will be expelled. See [animation](#animation)|
|`expelDuration` | 1000| (ms) speed of `expelAnimation`|
|`expelGap`|0| (ms) the exit gap of modules in `expelAnimation`|
|`lockString`|"mmm-scenes"| Lock-key of MM's locking mechanism. Generally, you don't need to touch. |
|`inactiveIndicators`| ['□'] | Array of inactive scene indicators See [indicators](#indicators) |
|`activeIndicators`| ['■'] | Array of active scene indicators. See [indicators](#indicators)

## Assign scene to modules

Usually, A scene is defined as text. If you want some module to admit into the specific scene, give the scene name as module's class name. 
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
In this example, `clock` module will appear in `scene1` and `scene3` and will be expelled from `scene2` or `scene4`. `helloworld` module will appear only in `scene2`

## Describe scenes in `scenario`

In module's configuration, you can describe `scenario` with which scenes will appear by order.
```js
config: {
  scenario: ["scene1", "scene2", "scene1", "scene3", "scene1", "scene4"],
}
```
All the scenes have same properties in above global property-values by default. But you can specify scene with scene definition in `scenario`
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
`admitAnimation` and `expelAnimation` would point which animation effect would be applied into each scene transition.
They could have 3 types of values as definition of animation.

### - `predefined animation name`
In `animation.mjs` file, predefined animation behaviours are prepared. You can select one of them for your animation effect. 
```js
expelAnimation: "jelly",
admitAnimation: "pageDown"
```

### - `keyframe array or object` 
Or you can set `keyframe` array or object for your own custom animation. (See [reference](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Keyframe_Formats))
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
Or you can assign your own animation function to control more detailly. Animation function should return `Promise` or be `async function` to know when the animation finishes.
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

An animation function will get `DefinitionObject { moduleWrapper, module, duration, isExpel }` argument. Return value has to be `Promise`

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
### Incoming notifications (control notification)
- Each incoming notification could have a `callback` function as a member of payload. It will be called when your notification requsting is done and `admitAnimation` is finished.
```js
this.sendNotification('SCENE_NEXT', {
  callback: (response) => { console.log(response.ok) }
})
```
- You can override animation for this instant scene changing with `payload.options` 
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
Play next scene. If current scene is not inside of `scenario`, the next scene will be the first scene(index: 0) of the `scenario`

#### `SCENES_PREV`, payload: { callback, options }
Play previous scene. If current scene is not inside of `scenario`, the previous scene doesn't exist. 

#### `SCENES_ACT`, payload: { callback, options, name, index }
Play specific scene. 
- With `name` payload, It will show the modules which have that name as class. If not exists, no module will appear. (Empty screen)
- With `index` payload, It will show the Nth module of scenario. If wrong index, nothing happened. The index is zero-based. (index:0 => first scene, index:1 => second scene)
- If `name` and `index` are used together at same time, `name` is prior to `index`


#### `SCENES_CURRENT`, payload: { callback }
Ask information of current scene. `callback` function will get various data object as an argument.
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
When scene is changed, this information will be emitted.



### WebAPI endpoints
You can access MM url to control this module from outside of MM. e.g.) IFTTT.
#### GET /scenes/next
Play next scene.

#### GET /scenes/prev
Play previous scene
#### GET /scenes/act/:indexNumber
Play specific scene with index
```
http://localhost/scenes/act/1
```

#### GET /scenes/act/:sceneName
Play specific scene with name
```
http://localhost/scenes/act/scene2
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

- When current scene is not belong to `scenario`, the `scene name` will be displayed instead of scene indicator
- When the number of indicators are less than that of `scenario`, the last item will be applied to the rest of the `scenario`. (the first example or the third example.)
- The HTML created will be like this; Indicators are decoratable by CSS in your `custom.css`
```html
<div class="scenes_indicator">
  <span class="scenes_indicator_scene index_0 inactive first">○</span>
  <span class="scenes_indicator_scene index_1 active">●</span> <!-- current scene -->
  <span class="scenes_indicator_scene index_2 inactive last">○</span>
<div>
```
```css
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
  contents: "[ "
}
.scenes_indicator_scene.first::after {
  contents: " ]"
}
```