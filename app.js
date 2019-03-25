const noble = require('noble');
const WebSocket = require('ws');
const {
  extractEulerComponents,
} = require('./util');

/*
https://nordicsemiconductor.github.io/Nordic-Thingy52-FW/documentation/firmware_architecture.html#arch_motion
*/
const THINGY_UUID = 'EF680100-9B35-4933-9B10-52FFA9740042'.split('-').join('').toLowerCase();
const MOTION_SERVICE_UUID = 'EF680400-9B35-4933-9B10-52FFA9740042'.split('-').join('').toLowerCase();
const MOTION_CONFIG_CHARACTERISTIC_UUID = 'EF680401-9B35-4933-9B10-52FFA9740042'.split('-').join('').toLowerCase();
const MOTION_EULER_CHARACTERISTIC_UUID = 'EF680407-9B35-4933-9B10-52FFA9740042'.split('-').join('').toLowerCase();

let configCharacteristic = null;
let eulerCharacteristic = null;

const wss = new WebSocket.Server({ port: 8080 });

noble.on('stateChange', function(state) {
  if (state === 'poweredOn') {
    console.log(`Starting scanning for device ${THINGY_UUID}`)
    noble.startScanning([THINGY_UUID]);
  } else {
    noble.stopScanning();
  }
});

noble.on('discover', function(peripheral) {
  noble.stopScanning();
  console.log('found peripheral:', peripheral.advertisement);

  peripheral.connect(function(err) {
    peripheral.discoverServices([MOTION_SERVICE_UUID], function(err, services) {
      services.forEach(function(service) {
        console.log('found service:', service.uuid);

        service.discoverCharacteristics([], function(err, characteristics) {

          characteristics.forEach(function(characteristic) {

            console.log('found characteristic:', characteristic.uuid);

            if (MOTION_EULER_CHARACTERISTIC_UUID === characteristic.uuid) {
              eulerCharacteristic = characteristic;
            }
            if (MOTION_CONFIG_CHARACTERISTIC_UUID === characteristic.uuid) {
              configCharacteristic = characteristic;
            }
          })

          if (eulerCharacteristic && configCharacteristic) {
            captureEulerAngles();
          } else {
            console.log('Unable to find euler characteristic');
          }
        })
      })
    })
  })
})



const captureEulerAngles = () => {
  // configCharacteristic.write()
  eulerCharacteristic.subscribe((error) => {
    if (!error) {
      eulerCharacteristic.on('read', (data, isNotification) => {
        eulerAngles = extractEulerComponents(data);
        console.log(eulerAngles);
        wss.clients.forEach((ws) => {
          try {
            ws.send(JSON.stringify(eulerAngles));
          } catch (error) {
            console.log(error);
          }
        })
      })
    }
  })
}
