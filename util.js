const convertLittleEndianByteArrayToNumber = b => (b[3] << 24) | (b[2] << 16) | (b[1] << 8) | (b[0]);

const q16ToFloat = qNum => parseFloat(qNum) / parseFloat(1 << 16);

const extractEulerComponents = (eulerBytes) => {
  /*
  Attitude represented in Euler angles (16Q16 fixed point)
  int32_t - roll [degrees]
  int32_t - pitch [degrees]
  int32_t - yaw [degrees]
  */
  const roll = q16ToFloat(convertLittleEndianByteArrayToNumber(eulerBytes.slice(0, 4)));
  const pitch = q16ToFloat(convertLittleEndianByteArrayToNumber(eulerBytes.slice(4, 8)));
  const yaw = q16ToFloat(convertLittleEndianByteArrayToNumber(eulerBytes.slice(8, 12)));
  return { roll, pitch, yaw }
};

module.exports = {
  extractEulerComponents,
};
