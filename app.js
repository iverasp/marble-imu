const noble = require('noble');

/*
https://nordicsemiconductor.github.io/Nordic-Thingy52-FW/documentation/firmware_architecture.html#arch_motion
*/
const THINGY_UUID = 'EF680100-9B35-4933-9B10-52FFA9740042'.split('-').join('').toLowerCase();
const MOTION_SERVICE_UUID = 'EF680400-9B35-4933-9B10-52FFA9740042'.split('-').join('').toLowerCase();
const MOTION_CONFIG_CHARACTERISTIC_UUID = 'EF680401-9B35-4933-9B10-52FFA9740042'.split('-').join('').toLowerCase();
const MOTION_EULER_CHARACTERISTIC_UUID = 'EF680407-9B35-4933-9B10-52FFA9740042'.split('-').join('').toLowerCase();

let configCharacteristic = null;
let eulerCharacteristic = null;

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

const swapEndianness = (val) => (
   ((val & 0xFF) << 24)
    | ((val & 0xFF00) << 8)
    | ((val >> 8) & 0xFF00)
    | ((val >> 24) & 0xFF)
);

const bytesToInt32 = (bytes) => {
  var buf = new ArrayBuffer(4);
  // Create a data view of it
  var view = new DataView(buf);

  // set bytes
  bytes.forEach(function (b, i) {
      view.setUint8(i, b);
  });

  // Read the bits as a float; note that by doing this, we're implicitly
  // converting it from a 32-bit float into JavaScript's native 64-bit double
  var num = view.getInt32(0);
  return num;
};

const int32ToAngles = val => (
  
)

const extractEulerComponents = (eulerBytes) => {
  /*
  Attitude represented in Euler angles (16Q16 fixed point)
  int32_t - roll [degrees]
  int32_t - pitch [degrees]
  int32_t - yaw [degrees]
  */
  // let roll = new Uint32Array(eulerBytes.slice(0, 4))[0];
  const roll = swapEndianness(bytesToInt32(eulerBytes.slice(0, 4)));
  const pitch = bytesToFloat(eulerBytes.slice(4, 8));
  const yaw = eulerBytes.slice(8, 12);
  // return { roll, pitch, yaw }
  return roll;
};

const captureEulerAngles = () => {
  // configCharacteristic.write()
  eulerCharacteristic.subscribe((error) => {
    if (!error) {
      eulerCharacteristic.on('read', (data, isNotification) => {
        console.log(extractEulerComponents(data));
      })
    }
  })
}
