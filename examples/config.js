/* Magic Mirror Config Sample
 *
 * By Michael Teeuw https://michaelteeuw.nl
 * MIT Licensed.
 *
 * For more information on how you can configure this file
 * see https://docs.magicmirror.builders/getting-started/configuration.html#general
 * and https://docs.magicmirror.builders/modules/configuration.html
 */
const config = {
  address: 'localhost', // Address to listen on, can be:
  // - "localhost", "127.0.0.1", "::1" to listen on loopback interface
  // - another specific IPv4/6 to listen on a specific interface
  // - "0.0.0.0", "::" to listen on any interface
  // Default, when address config is left out or empty, is "localhost"
  port: 8080,
  basePath: '/', // The URL path where MagicMirror is hosted. If you are using a Reverse proxy
  // you must set the sub path here. basePath must end with a /
  ipWhitelist: ['127.0.0.1', '::ffff:127.0.0.1', '::1'], // Set [] to allow all IP addresses
  // or add a specific IPv4 of 192.168.1.5 :
  // ["127.0.0.1", "::ffff:127.0.0.1", "::1", "::ffff:192.168.1.5"],
  // or IPv4 range of 192.168.3.0 --> 192.168.3.15 use CIDR format :
  // ["127.0.0.1", "::ffff:127.0.0.1", "::1", "::ffff:192.168.3.0/28"],

  useHttps: false, // Support HTTPS or not, default "false" will use HTTP
  httpsPrivateKey: '', // HTTPS private key path, only require when useHttps is true
  httpsCertificate: '', // HTTPS Certificate path, only require when useHttps is true

  language: 'en',
  locale: 'en-US',
  logLevel: ['INFO', 'LOG', 'WARN', 'ERROR'], // Add "DEBUG" for even more logging
  timeFormat: 24,
  units: 'metric',
  // serverOnly:  true/false/"local" ,
  // local for armv6l processors, default
  //   starts serveronly and then starts chrome browser
  // false, default for all NON-armv6l devices
  // true, force serveronly mode, because you want to.. no UI on this device

  modules: [
    {
      module: 'alert'
    },
    {
      module: 'updatenotification',
      position: 'top_bar'
    },
    {
      module: 'clock',
      position: 'top_left',
      classes: 'scene1 scene2',
      customAnimation: true,
      hideOnStart: true
    },
    {
      module: 'weather',
      position: 'top_right',
      classes: 'scene1 scene2',
      hiddenOnStartup: true,
      config: {
        weatherProvider: 'openweathermap',
        type: 'current',
        location: 'New York',
        locationID: '5128581', // ID from http://bulk.openweathermap.org/sample/city.list.json.gz; unzip the gz file and find your city
        apiKey: 'YOUR KEY'
      }
    },
    {
      module: 'compliments',
      position: 'lower_third',
      classes: 'scene1 scene2 scene3',
      customAnimation: true
    },
    {
      module: 'calendar',
      header: 'US Holidays',
      position: 'top_left',
      classes: 'scene1 scene2',
      customAnimation: false,
      config: {
        calendars: [
          {
            symbol: 'calendar-check',
            url: 'webcal://www.calendarlabs.com/ical-calendar/ics/76/US_Holidays.ics'
          }
        ]
      }
    },

    {
      module: 'weather',
      position: 'top_right',
      classes: 'scene1 scene2',
      header: 'Weather Forecast',
      hiddenOnStartup: true,
      config: {
        weatherProvider: 'openweathermap',
        type: 'forecast',
        location: 'New York',
        locationID: '5128581', // ID from http://bulk.openweathermap.org/sample/city.list.json.gz; unzip the gz file and find your city
        apiKey: 'YOUR KEY'
      }
    },
    {
      module: 'newsfeed',
      position: 'top_bar',
      classes: 'scene1 scene2 scene3',
      config: {
        feeds: [
          {
            title: 'New York Times',
            url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml'
          }
        ],
        showSourceTitle: true,
        showPublishDate: true,
        broadcastNewsFeeds: true,
        broadcastNewsUpdates: true
      }
    },
    {
      module: 'helloworld',
      classes: 'empty',
      position: 'upper_third',
      hiddenOnStartup: true,
      config: {
        text: '<p class="large">Empty Scene</p>'
      }
    },

    {
      module: 'helloworld',
      classes: 'scene1 scene3',
      position: 'top_left',
      header: 'example module',
      hiddenOnStartup: true,
      config: {
        text: '<img src="https://picsum.photos/300/200?random=1">'
      }
    },
    {
      module: 'helloworld',
      classes: 'scene1 scene3',
      position: 'top_right',
      hiddenOnStartup: true,
      header: 'example module',
      config: {
        text: '<img src="https://picsum.photos/250/500?random=2">'
      }
    },
    {
      module: 'helloworld',
      classes: 'scene1 scene3',
      position: 'bottom_left',
      header: 'example_module',
      hiddenOnStartup: true,
      config: {
        text: '<img src="https://picsum.photos/300/200?random=3">'
      }
    },
    {
      module: 'MMM-Scenes',
      classes: 'scene1 scene2 scene3 empty',
      hiddenOnStartup: true,
      position: 'bottom_right',
      config: {
        duration: 8000,
        scenario: [
          'scene1',
          {
            name: 'empty',
            duration: 5000,
            expelAnimation: 'dismissOut'
          },
          {
            name: 'scene1',
            duration: 5000,
            admitAnimation: 'jelly',
            admitGap: 200,
            expelAnimation: ({ moduleWrapper, duration }) => {
              return new Promise((resolve, reject) => {
                moduleWrapper.animate([
                  { transform: 'scale(1,1)', opacity: 1 },
                  { transform: 'scale(10, 10)', opacity: 0 }
                ], { duration }).onfinish = resolve
              })
            }
          },
          {
            name: 'scene2',
            duration: 5000,
            expelAnimation: 'pageLeft',
            admitAnimation: 'pageDown'
          },
          {
            name: 'scene3',
            duration: 5000,
            expelAnimation: 'pageRight',
            admitAnimation: [
              { transform: 'rotate(-360deg) scale(0, 0)', opacity: 0 },
              { transform: 'rotate(360deg) scale(1, 1)', opacity: 1 }
            ]
          }
        ],
        autoLoop: 'infinity',
        activeIndicators: ['1', '⭐', '3', '😀', "<span style='color:orange; font-size:150%; font-weight:bold'>5</span>"]
        // You may need emoji-able fonts. This is a just sample.
      }
    }

  ]
}

/** ************* DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== 'undefined') { module.exports = config }
