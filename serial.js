var serial = {}
;(function() {
  'use strict'

  serial.getPorts = function() {
    return navigator.usb.getDevices().then(devices => {
      return devices.map(device => new serial.Port(device))
    })
  }

  serial.requestPort = function() {
    const filters = [
      // { 'vendorId': 0x2341, 'productId': 0x8036 },
      // { 'vendorId': 0x2341, 'productId': 0x8037 },
      // { 'vendorId': 0x2341, 'productId': 0x804d },
      // { 'vendorId': 0x2341, 'productId': 0x804e },
      // { 'vendorId': 0x2341, 'productId': 0x804f },
      // { 'vendorId': 0x2341, 'productId': 0x8050 },
      { vendorId: 0x0483, productId: 0x5710 }
    ]

    return navigator.usb
      .requestDevice({ filters: filters })
      .then(device => new serial.Port(device))
  }

  serial.Port = function(device) {
    this.device_ = device
  }

  serial.Port.prototype.connect = function() {
    let readLoop = () => {
      this.device_.transferIn(5, 64).then(
        result => {
          this.onReceive(result.data)
          readLoop()
        },
        error => {
          this.onReceiveError(error)
        }
      )
    }

    const openPort = {
      requestType: 'standard',
      recipient: 'device',
      request: 0x06,
      value: 0x01,
      index: 0x00
    }

    return this.device_
      .open()
      .then(() => {
        if (this.device_.configuration === null) {
          return this.device_.selectConfiguration(1)
        }
      })
      .then(() => this.device_.claimInterface(0))
      .then(() => this.device_.selectAlternateInterface(0, 0))
      .then(() => {
        let result = this.device_.controlTransferOut(openPort)
        console.log('result', result)
        return result
      })
      .then(() => {
        console.log('in')
        // readLoop()
      })
  }

  serial.Port.prototype.disconnect = function() {
    return this.device_
      .controlTransferOut({
        requestType: 'class',
        recipient: 'interface',
        request: 0x22,
        value: 0x00,
        index: 0x00
      })
      .then(() => this.device_.close())
  }

  serial.Port.prototype.send = function(data) {
    return this.device_.transferOut(4, data)
  }
})()
