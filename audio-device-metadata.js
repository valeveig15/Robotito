"use strict";
// Coarse, optional labels supplied by the dataset curator. Never read the
// hardware's serial number or persistent browser device ID for this metric.
const DEVICE_CLASSES=Object.freeze([
 "unspecified","phone","tablet","built-in","headset","usb","recorder","other"
]);
const allowed=new Set(DEVICE_CLASSES);
function normalizeDeviceClass(value){
 if(value===undefined)return "unspecified";
 if(typeof value!=="string"||!allowed.has(value))
  throw Error("Invalid deviceClass: choose a supported coarse category");
 return value;
}
module.exports={DEVICE_CLASSES,normalizeDeviceClass};
