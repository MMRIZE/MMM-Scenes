const NodeHelper = require('node_helper')
const bodyParser = require('body-parser')

module.exports = NodeHelper.create({
  start: function () {
    this.expressApp.use(bodyParser.json())
    this.expressApp.use(bodyParser.urlencoded({ extended: true }))

    this.expressApp.get('/scenes/:action', (req, res) => {
      if (req.params.action) {
        if (req.params.action === 'next' || req.params.action === 'prev') {
          const command =
            req.params.action === 'next' ? 'SCENES_NEXT' : 'SCENES_PREV'
          console.log(command)
          this.sendSocketNotification('ACTION', { command })
          res.status(200).send({ status: 200 })
          return
        }
      }
      res.status(400).send({
        message: 'Invalid request'
      })
    })

    this.expressApp.get('/scenes/act/:action', (req, res) => {
      if (req.params.action) {
        const payload = {}
        if (!isNaN(req.params.action) && req.params.action >= 0) {
          payload.index = +req.params.action
        } else if (typeof req.params.action === 'string') {
          payload.name = req.params.action
        }
        this.sendSocketNotification('ACTION', {
          command: 'SCENES_ACT',
          payload
        })
        res.status(200).send({ status: 200 })
        return
      }
      res.status(400).send({
        message: 'Invalid request'
      })
    })
  },

  socketNotificationReceived: function (notification, payload) {}
})
